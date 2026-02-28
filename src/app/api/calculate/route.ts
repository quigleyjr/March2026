import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { calculate } from '@/lib/engine'
import { supabase } from '@/lib/supabase/client'

const ActivityInputSchema = z.object({
  id: z.string(),
  source_type: z.string(),
  factor_id: z.string(),
  quantity: z.number().nonnegative(),
  unit: z.string(),
  period_start: z.string(),
  period_end: z.string(),
  site: z.string().optional(),
  notes: z.string().optional(),
  estimated: z.boolean().optional(),
})

const RequestSchema = z.object({
  organisation_name: z.string().min(1),
  reporting_period_start: z.string(),
  reporting_period_end: z.string(),
  inputs: z.array(ActivityInputSchema).min(1),
  save: z.boolean().optional().default(true),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = RequestSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 })
    }

    const { save, ...calculationRequest } = parsed.data
    const result = calculate(calculationRequest)

    if (save) {
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

      if (!calcError) {
        const lineRows = result.lines.map((l) => ({
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
        await supabase.from('emission_lines').insert(lineRows)
      }
    }

    return NextResponse.json({ success: true, result })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function GET() {
  const { data, error } = await supabase
    .from('calculations')
    .select('id, organisation_name, reporting_period_start, reporting_period_end, total_t_co2e, scope_1_t_co2e, scope_2_t_co2e, scope_3_t_co2e, data_quality_score, calculated_at')
    .order('calculated_at', { ascending: false })
    .limit(20)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ calculations: data })
}
