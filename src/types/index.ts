export type EmissionScope = 1 | 2 | 3

export type EmissionCategory =
  | 'stationary_combustion'
  | 'mobile_combustion'
  | 'purchased_electricity'
  | 'fuel_energy_related'

export interface EmissionFactor {
  id: string
  label: string
  scope: EmissionScope
  category: EmissionCategory
  unit: string
  unit_label: string
  kg_co2e_per_unit: number
  kg_co2_per_unit?: number
  kg_ch4_per_unit?: number
  kg_n2o_per_unit?: number
  source_table: string
  source_row: string
  source_column: string
  data_quality_tier: 1 | 2 | 3 | 4
  ghg_protocol_category?: number
  [key: string]: unknown
}

export interface ActivityInput {
  id: string
  source_type: string
  factor_id: string
  quantity: number
  unit: string
  period_start: string
  period_end: string
  site?: string
  notes?: string
  estimated?: boolean
}

export interface AuditEntry {
  factor_id: string
  factor_label: string
  factor_version: string
  source_table: string
  source_row: string
  source_column: string
  kg_co2e_per_unit: number
  quantity: number
  unit: string
  formula: string
  calculated_at: string
}

export interface EmissionLineResult {
  input: ActivityInput
  factor: EmissionFactor
  factor_version: string
  kg_co2e: number
  t_co2e: number
  scope: EmissionScope
  category: EmissionCategory
  data_quality_tier: number
  audit: AuditEntry
}

export type GapSeverity = 'critical' | 'moderate' | 'minor'

export interface GapItem {
  code: string
  severity: GapSeverity
  message: string
  recommendation: string
}

export interface CalculationResult {
  id: string
  organisation_name: string
  reporting_period_start: string
  reporting_period_end: string
  calculated_at: string
  factor_version: string
  lines: EmissionLineResult[]
  summary: {
    total_t_co2e: number
    scope_1_t_co2e: number
    scope_2_t_co2e: number
    scope_3_t_co2e: number
    data_quality_score: number
    estimated_lines: number
    uncertainty_pct: number
  }
  gaps: GapItem[]
  metadata: {
    ghg_protocol_consolidation: string
    scope_2_method: string
  }
}
