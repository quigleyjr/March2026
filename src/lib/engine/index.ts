import { getFactor, getFactorVersion } from '@/lib/factors'
import type { ActivityInput, AuditEntry, CalculationResult, EmissionLineResult, GapItem, IntensityMetrics, SiteBreakdown } from '@/types'

function round(n: number, dp: number): number {
  const f = Math.pow(10, dp)
  return Math.round(n * f) / f
}

function sumT(lines: EmissionLineResult[]): number {
  return lines.reduce((acc, l) => acc + l.t_co2e, 0)
}

function generateId(): string {
  return `calc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

// ── WTT Auto-injection ────────────────────────────────────────────
const WTT_MAP: Record<string, string> = {
  natural_gas_kwh:    'natural_gas_wtt',
  natural_gas_m3:     'natural_gas_wtt',
  natural_gas_therms: 'natural_gas_wtt',
  petrol_litres:      'petrol_wtt',
  petrol_km:          'petrol_wtt',
  diesel_litres:      'diesel_wtt',
  diesel_km:          'diesel_wtt',
  van_diesel_km:      'diesel_wtt',
  electricity_kwh:    'electricity_td_losses',
}

const WTT_UNIT: Record<string, string> = {
  natural_gas_wtt:       'kWh',
  petrol_wtt:            'litres',
  diesel_wtt:            'litres',
  electricity_td_losses: 'kWh',
}

const KM_TO_LITRES: Record<string, number> = {
  petrol_km:    0.08,
  diesel_km:    0.07,
  van_diesel_km:0.10,
}

function buildWttInputs(inputs: ActivityInput[]): ActivityInput[] {
  return inputs.flatMap((input) => {
    const wttFactorId = WTT_MAP[input.factor_id]
    if (!wttFactorId) return []
    let quantity = input.quantity
    if (KM_TO_LITRES[input.factor_id]) quantity = round(input.quantity * KM_TO_LITRES[input.factor_id], 4)
    if (input.factor_id === 'natural_gas_m3') quantity = round(input.quantity * 11.163, 4)
    if (input.factor_id === 'natural_gas_therms') quantity = round(input.quantity * 29.3071, 4)
    return [{ id: `${input.id}_wtt`, source_type: wttFactorId, factor_id: wttFactorId, quantity, unit: WTT_UNIT[wttFactorId], period_start: input.period_start, period_end: input.period_end, site: input.site, estimated: input.estimated, notes: `Auto WTT for ${input.factor_id}` }]
  })
}

// ── Site Breakdown ────────────────────────────────────────────────
function buildSiteBreakdown(lines: EmissionLineResult[]): SiteBreakdown[] {
  const siteMap: Record<string, SiteBreakdown> = {}

  lines.forEach((l) => {
    const site = l.input.site || 'Unassigned'
    if (!siteMap[site]) {
      siteMap[site] = { site, t_co2e: 0, scope_1: 0, scope_2: 0, scope_3: 0, line_count: 0 }
    }
    siteMap[site].t_co2e = round(siteMap[site].t_co2e + l.t_co2e, 4)
    if (l.scope === 1) siteMap[site].scope_1 = round(siteMap[site].scope_1 + l.t_co2e, 4)
    if (l.scope === 2) siteMap[site].scope_2 = round(siteMap[site].scope_2 + l.t_co2e, 4)
    if (l.scope === 3) siteMap[site].scope_3 = round(siteMap[site].scope_3 + l.t_co2e, 4)
    // Only count non-WTT lines in line count
    if (!l.input.notes?.startsWith('Auto WTT')) siteMap[site].line_count++
  })

  return Object.values(siteMap).sort((a, b) => b.t_co2e - a.t_co2e)
}

// ── Line Calculation ──────────────────────────────────────────────
export function calculateLine(input: ActivityInput): EmissionLineResult {
  const factor = getFactor(input.factor_id)
  const factor_version = getFactorVersion()
  if (input.unit !== factor.unit) throw new Error(`Unit mismatch for "${factor.id}": expected "${factor.unit}", got "${input.unit}"`)
  if (input.quantity < 0) throw new Error(`Quantity must be >= 0 for input "${input.id}"`)
  const kg_co2e = round(input.quantity * factor.kg_co2e_per_unit, 6)
  const t_co2e = round(kg_co2e / 1000, 6)
  const audit: AuditEntry = {
    factor_id: factor.id, factor_label: factor.label, factor_version,
    source_table: factor.source_table, source_row: factor.source_row, source_column: factor.source_column,
    kg_co2e_per_unit: factor.kg_co2e_per_unit, quantity: input.quantity, unit: input.unit,
    formula: `${input.quantity} ${factor.unit} × ${factor.kg_co2e_per_unit} = ${kg_co2e} kg CO₂e`,
    calculated_at: new Date().toISOString(),
  }
  return { input, factor, factor_version, kg_co2e, t_co2e, scope: factor.scope, category: factor.category, data_quality_tier: factor.data_quality_tier, audit }
}

// ── Full Calculation ──────────────────────────────────────────────
export interface CalculationRequest {
  organisation_name: string
  reporting_period_start: string
  reporting_period_end: string
  inputs: ActivityInput[]
  intensity?: IntensityMetrics
}

export function calculate(request: CalculationRequest): CalculationResult {
  const { organisation_name, reporting_period_start, reporting_period_end, inputs, intensity } = request
  if (!inputs || inputs.length === 0) throw new Error('No activity inputs provided.')

  const wttInputs = buildWttInputs(inputs)
  const allInputs = [...inputs, ...wttInputs]
  const lines = allInputs.map((input) => calculateLine(input))

  const scope1 = lines.filter((l) => l.scope === 1)
  const scope2 = lines.filter((l) => l.scope === 2)
  const scope3 = lines.filter((l) => l.scope === 3)
  const scope_1_t_co2e = round(sumT(scope1), 4)
  const scope_2_t_co2e = round(sumT(scope2), 4)
  const scope_3_t_co2e = round(sumT(scope3), 4)
  const total_t_co2e = round(scope_1_t_co2e + scope_2_t_co2e + scope_3_t_co2e, 4)
  const estimated_lines = inputs.filter((i) => i.estimated).length

  const tierWeights: Record<number, number> = { 1: 100, 2: 80, 3: 50, 4: 20 }
  const total = sumT(lines)
  let data_quality_score = 100
  if (total > 0) {
    let weighted = 0
    lines.forEach((l) => { weighted += ((tierWeights[l.data_quality_tier] ?? 20) * (l.input.estimated ? 0.6 : 1.0)) * (l.t_co2e / total) })
    data_quality_score = Math.round(weighted)
  }

  const tierUncertainty: Record<number, number> = { 1: 5, 2: 10, 3: 25, 4: 50 }
  let uncertainty_pct = 0
  if (total > 0) {
    let wu = 0
    lines.forEach((l) => { wu += ((tierUncertainty[l.data_quality_tier] ?? 50) + (l.input.estimated ? 15 : 0)) * (l.t_co2e / total) })
    uncertainty_pct = Math.round(wu)
  }

  // Intensity metrics
  let intensityResult: IntensityMetrics | undefined
  if (intensity) {
    intensityResult = { ...intensity }
    if (intensity.employees && intensity.employees > 0) intensityResult.per_employee = round(total_t_co2e / intensity.employees, 4)
    if (intensity.revenue_m && intensity.revenue_m > 0) intensityResult.per_revenue_m = round(total_t_co2e / intensity.revenue_m, 4)
    if (intensity.floor_area_m2 && intensity.floor_area_m2 > 0) intensityResult.per_floor_area = round(total_t_co2e / intensity.floor_area_m2, 4)
  }

  // Site breakdown
  const sites = buildSiteBreakdown(lines)

  // Gap detection
  const gaps: GapItem[] = []
  if (scope2.length === 0) gaps.push({ code: 'MISSING_SCOPE_2', severity: 'critical', message: 'No Scope 2 electricity data provided.', recommendation: 'Add electricity consumption from utility invoices. Required for SECR.' })
  if (scope1.length === 0) gaps.push({ code: 'MISSING_SCOPE_1', severity: 'critical', message: 'No Scope 1 emissions data provided.', recommendation: 'Add natural gas or vehicle fuel data. Required for SECR.' })
  if (estimated_lines > 0) gaps.push({ code: 'ESTIMATED_DATA', severity: 'moderate', message: `${estimated_lines} line(s) use estimated quantities.`, recommendation: 'Replace estimates with actual meter reads before final disclosure.' })
  if (!intensity?.employees) gaps.push({ code: 'MISSING_INTENSITY', severity: 'minor', message: 'Intensity metrics not provided.', recommendation: 'Add employee count and revenue to calculate tCO₂e per employee and per £m revenue. Required for SECR.' })

  return {
    id: generateId(),
    organisation_name, reporting_period_start, reporting_period_end,
    calculated_at: new Date().toISOString(),
    factor_version: getFactorVersion(),
    lines,
    summary: { total_t_co2e, scope_1_t_co2e, scope_2_t_co2e, scope_3_t_co2e, data_quality_score, estimated_lines, uncertainty_pct, sites },
    intensity: intensityResult,
    gaps,
    metadata: { ghg_protocol_consolidation: 'operational_control', scope_2_method: 'location_based' },
  }
}
