import { NextRequest, NextResponse } from 'next/server'
import { calculate } from '@/lib/engine'
import { supabase } from '@/lib/supabase/client'
import type { ActivityInput } from '@/types'

export const maxDuration = 60

// ── CSV parser (no external dep) ──────────────────────────────────────────────
function parseCSV(text: string): Record<string, string>[] {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')
  if (lines.length < 2) return []

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/_+/g, '_'))

  const rows: Record<string, string>[] = []
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    // Handle quoted values
    const values: string[] = []
    let cur = '', inQuote = false
    for (const ch of line) {
      if (ch === '"') { inQuote = !inQuote }
      else if (ch === ',' && !inQuote) { values.push(cur.trim()); cur = '' }
      else cur += ch
    }
    values.push(cur.trim())
    const row: Record<string, string> = {}
    headers.forEach((h, idx) => { row[h] = values[idx] ?? '' })
    rows.push(row)
  }
  return rows
}

// ── Normalise column names (flexible mapping) ─────────────────────────────────
function normalise(row: Record<string, string>) {
  const get = (...keys: string[]) => {
    for (const k of keys) {
      if (row[k] !== undefined && row[k] !== '') return row[k]
    }
    return ''
  }
  return {
    organisation_name:      get('organisation_name', 'company_name', 'company', 'org_name'),
    period_start:           get('reporting_period_start', 'period_start', 'start_date', 'start'),
    period_end:             get('reporting_period_end', 'period_end', 'end_date', 'end'),
    factor_id:              get('factor_id', 'source_id', 'emission_source_id', 'source'),
    quantity:               get('quantity', 'amount', 'value'),
    unit:                   get('unit', 'units'),
    site:                   get('site', 'location'),
    estimated:              get('estimated', 'is_estimated', 'estimate'),
    employees:              get('employees', 'num_employees', 'headcount'),
    revenue_m:              get('revenue_m', 'revenue', 'turnover_m'),
    floor_area_m2:          get('floor_area_m2', 'floor_area', 'area_m2'),
  }
}

// ── Group rows → company+period buckets ───────────────────────────────────────
function groupRows(rows: Record<string, string>[]) {
  const groups = new Map<string, {
    organisation_name: string
    period_start: string
    period_end: string
    employees?: number
    revenue_m?: number
    floor_area_m2?: number
    inputs: ActivityInput[]
  }>()

  let lineId = 0
  for (const raw of rows) {
    const r = normalise(raw)
    if (!r.organisation_name || !r.factor_id || !r.quantity) continue

    const key = `${r.organisation_name}||${r.period_start}||${r.period_end}`
    if (!groups.has(key)) {
      groups.set(key, {
        organisation_name: r.organisation_name,
        period_start: r.period_start,
        period_end: r.period_end,
        employees:     r.employees     ? parseFloat(r.employees)     : undefined,
        revenue_m:     r.revenue_m     ? parseFloat(r.revenue_m)     : undefined,
        floor_area_m2: r.floor_area_m2 ? parseFloat(r.floor_area_m2) : undefined,
        inputs: [],
      })
    }

    const g = groups.get(key)!
    // Take first valid org-level values
    if (!g.employees     && r.employees)     g.employees     = parseFloat(r.employees)
    if (!g.revenue_m     && r.revenue_m)     g.revenue_m     = parseFloat(r.revenue_m)
    if (!g.floor_area_m2 && r.floor_area_m2) g.floor_area_m2 = parseFloat(r.floor_area_m2)

    const qty = parseFloat(r.quantity)
    if (isNaN(qty) || qty < 0) continue

    lineId++
    g.inputs.push({
      id: `imp_${lineId}`,
      source_type: r.factor_id,
      factor_id: r.factor_id,
      quantity: qty,
      unit: r.unit || '',
      period_start: r.period_start,
      period_end: r.period_end,
      site: r.site || undefined,
      estimated: r.estimated?.toLowerCase() === 'yes' || r.estimated === '1' || r.estimated?.toLowerCase() === 'true',
    })
  }

  return Array.from(groups.values())
}

// ── Save one result to Supabase ────────────────────────────────────────────────
async function saveResult(result: ReturnType<typeof calculate>) {
  const { error: calcError } = await supabase.from('calculations').insert({
    id: result.id,
    organisation_name: result.organisation_name,
    reporting_period_start: result.reporting_period_start,
    reporting_period_end: result.reporting_period_end,
    calculated_at: result.calculated_at,
    factor_version: result.factor_version,
    total_t_co2e: result.summary.total_t_co2e,
    scope_1_t_co2e: result.summary.scope_1_t_co2e,
    scope_2_t_co2e: result.summary.scope_2_t_co2e,
    scope_3_t_co2e: result.summary.scope_3_t_co2e,
    data_quality_score: result.summary.data_quality_score,
    uncertainty_pct: result.summary.uncertainty_pct,
    estimated_lines: result.summary.estimated_lines,
    consolidation_approach: result.metadata.ghg_protocol_consolidation,
    scope_2_method: result.metadata.scope_2_method,
    result_json: result,
  })

  if (!calcError && result.lines.length > 0) {
    await supabase.from('emission_lines').insert(
      result.lines.map(l => ({
        calculation_id: result.id,
        input_id: l.input.id,
        source_type: l.input.source_type,
        factor_id: l.factor.id,
        factor_version: l.factor_version,
        scope: l.scope,
        category: l.category,
        quantity: l.input.quantity,
        unit: l.input.unit,
        kg_co2e: l.kg_co2e,
        t_co2e: l.t_co2e,
        data_quality_tier: l.data_quality_tier,
        estimated: l.input.estimated ?? false,
        site: l.input.site ?? null,
        period_start: l.input.period_start,
        period_end: l.input.period_end,
        audit_json: l.audit,
      }))
    )
  }

  return calcError
}

// ── POST /api/import ──────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })

    const text = await file.text()
    const rows = parseCSV(text)
    if (rows.length === 0) return NextResponse.json({ error: 'No data rows found in CSV' }, { status: 400 })

    const groups = groupRows(rows)
    if (groups.length === 0) return NextResponse.json({ error: 'Could not parse any valid calculation groups. Check required columns: organisation_name, factor_id, quantity, period_start, period_end' }, { status: 400 })

    const results: Array<{ organisation_name: string; period_start: string; period_end: string; total_t_co2e: number; lines: number; id: string }> = []
    const errors: Array<{ organisation_name: string; period_start: string; error: string }> = []

    for (const group of groups) {
      try {
        if (group.inputs.length === 0) continue

        const result = calculate({
          organisation_name: group.organisation_name,
          reporting_period_start: group.period_start,
          reporting_period_end: group.period_end,
          inputs: group.inputs,
          intensity: {
            employees: group.employees,
            revenue_m: group.revenue_m,
            floor_area_m2: group.floor_area_m2,
          },
        })

        await saveResult(result)

        results.push({
          organisation_name: group.organisation_name,
          period_start: group.period_start,
          period_end: group.period_end,
          total_t_co2e: result.summary.total_t_co2e,
          lines: group.inputs.length,
          id: result.id,
        })
      } catch (err) {
        errors.push({
          organisation_name: group.organisation_name,
          period_start: group.period_start,
          error: err instanceof Error ? err.message : 'Unknown error',
        })
      }
    }

    return NextResponse.json({
      success: true,
      total_rows: rows.length,
      total_groups: groups.length,
      imported: results.length,
      failed: errors.length,
      results,
      errors,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Import failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
