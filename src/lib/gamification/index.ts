// FreshESG Gamification Engine — Per-Organisation, History-Based
//
// Design principle: every achievement measures what THIS organisation has
// actually done with its emissions over time. XP reflects genuine ESG
// progress, not how many times someone clicked "Calculate".

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  category: 'reduction' | 'quality' | 'coverage' | 'consistency' | 'transparency'
  xp: number
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  unlocked: boolean
  unlocked_at?: string
  context?: string        // e.g. "↓ 18.4% vs 2023" — shown on unlocked badge
  progress?: number       // 0–100 for in-progress
  progress_label?: string // e.g. "1 of 3 consecutive years"
  target_value?: number   // e.g. the threshold being worked towards
}

export interface ESGLevel {
  level: number
  title: string
  colour: string
  min_xp: number
  description: string    // what this level means for the org
}

export interface PeriodSnapshot {
  period_start: string
  period_end: string
  calculated_at: string
  total_t_co2e: number
  scope_1_t_co2e: number
  scope_2_t_co2e: number
  scope_3_t_co2e: number
  data_quality_score: number
  estimated_lines: number
  site_count: number
  travel_type_count: number
  has_cat1: boolean
  has_scope3: boolean
  share_token?: string | null
}

export interface OrgGamificationState {
  org_name: string
  periods: PeriodSnapshot[]           // oldest → newest
  latest: PeriodSnapshot
  baseline: PeriodSnapshot | null     // earliest period (reference point)
  xp: number
  level: ESGLevel
  next_level: ESGLevel | null
  xp_to_next: number
  xp_progress_pct: number
  achievements: Achievement[]
  unlocked_count: number
  // Key performance metrics for display
  best_reduction_pct: number | null   // best single-period YoY reduction
  total_abated_t: number              // tCO2e removed vs baseline
  consecutive_reductions: number      // current streak of year-on-year falls
  quality_trend: 'improving' | 'stable' | 'declining' | null
}

// ── Levels — earned by organisational improvement, not platform activity ──────
export const LEVELS: ESGLevel[] = [
  { level: 1, title: 'Footprint Mapped',     colour: '#8a9e86', min_xp: 0,    description: 'Established a baseline emissions inventory' },
  { level: 2, title: 'Scope Covered',        colour: '#4ca66a', min_xp: 150,  description: 'Reporting across all three emission scopes' },
  { level: 3, title: 'First Reduction',      colour: '#1a7a3c', min_xp: 350,  description: 'Achieved a year-on-year emissions decrease' },
  { level: 4, title: 'Quality Assured',      colour: '#1a6b6b', min_xp: 650,  description: 'Consistently high-quality, audit-ready data' },
  { level: 5, title: 'Sustained Trajectory', colour: '#1a4d8c', min_xp: 1100, description: 'Multiple consecutive years of reduction' },
  { level: 6, title: 'Double Digit Cutter',  colour: '#5b2d9e', min_xp: 1700, description: 'Achieved 10%+ reduction against baseline' },
  { level: 7, title: 'Net Zero Aligned',     colour: '#b87a00', min_xp: 2600, description: '20%+ cumulative reduction, on a net-zero path' },
  { level: 8, title: 'Carbon Leader',        colour: '#c0392b', min_xp: 4000, description: '30%+ reduction, scope 2 near zero' },
  { level: 9, title: 'Deep Decarboniser',    colour: '#141a12', min_xp: 6000, description: '40%+ reduction with full scope 3 coverage' },
  { level: 10, title: 'Net Zero Pioneer',    colour: '#1a7a3c', min_xp: 9000, description: '50%+ reduction against baseline — net zero trajectory' },
]

// ── Achievements — all based on this org's own trajectory ────────────────────
//
// Each achievement answers: "compared to our own history, what have we done?"
// Nothing here rewards just submitting data — only what the data shows.

export const ALL_ACHIEVEMENTS: Achievement[] = [
  // ── Reduction ──────────────────────────────────────────────────────────────
  {
    id: 'any_reduction',
    name: 'Going Down',
    icon: '📉',
    description: 'Any year-on-year emissions reduction vs the previous period',
    category: 'reduction', xp: 150, rarity: 'common', unlocked: false,
  },
  {
    id: 'reduction_5pct',
    name: '5% Leaner',
    icon: '🌱',
    description: 'Reduce total emissions by 5% or more vs the prior period',
    category: 'reduction', xp: 250, rarity: 'common', unlocked: false,
  },
  {
    id: 'reduction_10pct',
    name: '10% Leaner',
    icon: '🍃',
    description: 'Reduce total emissions by 10% or more vs the prior period',
    category: 'reduction', xp: 400, rarity: 'rare', unlocked: false,
  },
  {
    id: 'reduction_20pct',
    name: 'Fifth Off',
    icon: '🌿',
    description: 'Reduce total emissions by 20% or more vs the prior period',
    category: 'reduction', xp: 650, rarity: 'epic', unlocked: false,
  },
  {
    id: 'reduction_30pct',
    name: 'Deep Cut',
    icon: '🌳',
    description: 'Reduce total emissions by 30% or more vs the prior period',
    category: 'reduction', xp: 900, rarity: 'epic', unlocked: false,
  },
  {
    id: 'vs_baseline_20pct',
    name: 'Baseline Beater',
    icon: '🏹',
    description: 'Total emissions are 20% lower than your earliest recorded period',
    category: 'reduction', xp: 700, rarity: 'epic', unlocked: false,
  },
  {
    id: 'vs_baseline_40pct',
    name: 'Half the Harm',
    icon: '⚡',
    description: 'Total emissions are 40% lower than your earliest recorded period',
    category: 'reduction', xp: 1200, rarity: 'legendary', unlocked: false,
  },
  {
    id: 'scope1_reduced',
    name: 'Burn Less',
    icon: '🔥',
    description: 'Scope 1 (direct combustion) emissions fell year-on-year',
    category: 'reduction', xp: 200, rarity: 'common', unlocked: false,
  },
  {
    id: 'scope2_reduced',
    name: 'Cleaner Grid',
    icon: '🔌',
    description: 'Scope 2 (electricity) emissions fell year-on-year',
    category: 'reduction', xp: 200, rarity: 'common', unlocked: false,
  },
  {
    id: 'scope3_reduced',
    name: 'Chain Reaction',
    icon: '🔗',
    description: 'Scope 3 (indirect) emissions fell year-on-year',
    category: 'reduction', xp: 250, rarity: 'rare', unlocked: false,
  },
  {
    id: 'scope2_zero',
    name: 'Grid Zero',
    icon: '⚡',
    description: 'Scope 2 emissions reach zero (100% renewable electricity)',
    category: 'reduction', xp: 800, rarity: 'legendary', unlocked: false,
  },

  // ── Consistency — streaks of sustained improvement ─────────────────────────
  {
    id: 'two_year_streak',
    name: 'On a Roll',
    icon: '📈',
    description: '2 consecutive periods of year-on-year reduction',
    category: 'consistency', xp: 300, rarity: 'rare', unlocked: false,
  },
  {
    id: 'three_year_streak',
    name: 'Sustained Progress',
    icon: '🏆',
    description: '3 consecutive periods of year-on-year reduction',
    category: 'consistency', xp: 600, rarity: 'epic', unlocked: false,
  },
  {
    id: 'five_year_streak',
    name: 'Unstoppable',
    icon: '🌍',
    description: '5 consecutive periods of year-on-year reduction',
    category: 'consistency', xp: 1500, rarity: 'legendary', unlocked: false,
  },
  {
    id: 'quality_improving',
    name: 'Better Every Year',
    icon: '📊',
    description: 'Data quality score improved in the most recent period',
    category: 'consistency', xp: 150, rarity: 'common', unlocked: false,
  },
  {
    id: 'quality_90_two_years',
    name: 'Audit Ready',
    icon: '✅',
    description: 'Data quality score of 90+ in two or more periods',
    category: 'consistency', xp: 350, rarity: 'rare', unlocked: false,
  },

  // ── Coverage — what the org actually measures ───────────────────────────────
  {
    id: 'all_scopes',
    name: 'Full Inventory',
    icon: '🔭',
    description: 'Reporting across all three scopes (S1 + S2 + S3 all > 0)',
    category: 'coverage', xp: 100, rarity: 'common', unlocked: false,
  },
  {
    id: 'scope3_added',
    name: 'Scope 3 Unlocked',
    icon: '🗂️',
    description: 'Added Scope 3 reporting after a period that only had S1/S2',
    category: 'coverage', xp: 200, rarity: 'rare', unlocked: false,
  },
  {
    id: 'cat1_included',
    name: 'Supply Chain Visible',
    icon: '📦',
    description: 'Scope 3 Category 1 (purchased goods & services) included in a period',
    category: 'coverage', xp: 250, rarity: 'rare', unlocked: false,
  },
  {
    id: 'coverage_expanding',
    name: 'Growing Transparency',
    icon: '🔬',
    description: 'Number of emission sources increased vs the prior period',
    category: 'coverage', xp: 100, rarity: 'common', unlocked: false,
  },
  {
    id: 'estimates_reducing',
    name: 'Measuring, Not Guessing',
    icon: '📏',
    description: 'Estimated lines fell vs the prior period (more metered data)',
    category: 'quality', xp: 200, rarity: 'rare', unlocked: false,
  },
  {
    id: 'zero_estimates',
    name: 'Fully Metered',
    icon: '💎',
    description: 'A period submitted with zero estimated emission lines',
    category: 'quality', xp: 400, rarity: 'epic', unlocked: false,
  },

  // ── Transparency ────────────────────────────────────────────────────────────
  {
    id: 'report_shared',
    name: 'Open Book',
    icon: '🔓',
    description: 'Published a shareable SECR report for this organisation',
    category: 'transparency', xp: 100, rarity: 'common', unlocked: false,
  },
  {
    id: 'three_periods',
    name: 'Track Record',
    icon: '📅',
    description: 'Three or more reporting periods on record for this organisation',
    category: 'transparency', xp: 200, rarity: 'rare', unlocked: false,
  },
  {
    id: 'five_periods',
    name: 'Long View',
    icon: '🗓️',
    description: 'Five or more reporting periods — a genuine longitudinal record',
    category: 'transparency', xp: 500, rarity: 'epic', unlocked: false,
  },
]

// ── Helpers ───────────────────────────────────────────────────────────────────
export function getLevelForXP(xp: number): { level: ESGLevel; next: ESGLevel | null } {
  let current = LEVELS[0]
  for (const l of LEVELS) {
    if (xp >= l.min_xp) current = l
    else break
  }
  const idx = LEVELS.indexOf(current)
  return { level: current, next: LEVELS[idx + 1] ?? null }
}

function fmtPct(pct: number): string {
  return `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`
}

// ── Core engine — takes one org's sorted periods (oldest first) ───────────────
export function computeOrgAchievements(periods: PeriodSnapshot[]): Achievement[] {
  if (periods.length === 0) return ALL_ACHIEVEMENTS.map(a => ({ ...a, unlocked: false }))

  const latest   = periods[periods.length - 1]
  const prev     = periods.length >= 2 ? periods[periods.length - 2] : null
  const baseline = periods[0]
  const n        = periods.length

  // ── YoY delta helpers ──
  const yoyTotal   = prev ? (prev.total_t_co2e - latest.total_t_co2e) / prev.total_t_co2e * 100 : null
  const yoyScope1  = prev ? (prev.scope_1_t_co2e - latest.scope_1_t_co2e) / Math.max(prev.scope_1_t_co2e, 0.001) * 100 : null
  const yoyScope2  = prev ? (prev.scope_2_t_co2e - latest.scope_2_t_co2e) / Math.max(prev.scope_2_t_co2e, 0.001) * 100 : null
  const yoyScope3  = prev ? (prev.scope_3_t_co2e - latest.scope_3_t_co2e) / Math.max(prev.scope_3_t_co2e, 0.001) * 100 : null

  // vs baseline
  const vsBaseline = n >= 2 ? (baseline.total_t_co2e - latest.total_t_co2e) / baseline.total_t_co2e * 100 : null

  // Consecutive reduction streak (count back from latest)
  let streak = 0
  for (let i = periods.length - 1; i >= 1; i--) {
    if (periods[i].total_t_co2e < periods[i - 1].total_t_co2e) streak++
    else break
  }

  // Quality trend
  const qLatest = latest.data_quality_score
  const qPrev   = prev?.data_quality_score ?? null

  // Scope3 newly added
  const scope3Added = prev && prev.scope_3_t_co2e === 0 && latest.scope_3_t_co2e > 0

  // Coverage expanding (more source types)
  // We use travel_type_count + site_count as a proxy
  const coverageExpanded = prev &&
    (latest.travel_type_count + (latest.has_cat1 ? 1 : 0)) >
    (prev.travel_type_count + (prev.has_cat1 ? 1 : 0))

  // Estimates reducing
  const estimatesReduced = prev && latest.estimated_lines < prev.estimated_lines

  // High quality count
  const highQualityCount = periods.filter(p => p.data_quality_score >= 90).length

  const checks: Record<string, { unlocked: boolean; context?: string; progress?: number; progressLabel?: string }> = {
    any_reduction:       { unlocked: yoyTotal !== null && yoyTotal > 0,   context: yoyTotal ? `↓ ${yoyTotal.toFixed(1)}% vs prior period` : undefined },
    reduction_5pct:      { unlocked: yoyTotal !== null && yoyTotal >= 5,  context: yoyTotal ? `↓ ${yoyTotal.toFixed(1)}%` : undefined, progress: yoyTotal ? Math.min(yoyTotal / 5 * 100, 100) : 0, progressLabel: yoyTotal ? `${yoyTotal.toFixed(1)}% of 5% target` : 'Need a prior period' },
    reduction_10pct:     { unlocked: yoyTotal !== null && yoyTotal >= 10, context: yoyTotal ? `↓ ${yoyTotal.toFixed(1)}%` : undefined, progress: yoyTotal ? Math.min(yoyTotal / 10 * 100, 100) : 0, progressLabel: yoyTotal ? `${yoyTotal.toFixed(1)}% of 10% target` : 'Need a prior period' },
    reduction_20pct:     { unlocked: yoyTotal !== null && yoyTotal >= 20, context: yoyTotal ? `↓ ${yoyTotal.toFixed(1)}%` : undefined, progress: yoyTotal ? Math.min(yoyTotal / 20 * 100, 100) : 0, progressLabel: yoyTotal ? `${yoyTotal.toFixed(1)}% of 20% target` : 'Need a prior period' },
    reduction_30pct:     { unlocked: yoyTotal !== null && yoyTotal >= 30, context: yoyTotal ? `↓ ${yoyTotal.toFixed(1)}%` : undefined, progress: yoyTotal ? Math.min(yoyTotal / 30 * 100, 100) : 0, progressLabel: yoyTotal ? `${yoyTotal.toFixed(1)}% of 30% target` : 'Need a prior period' },
    vs_baseline_20pct:   { unlocked: vsBaseline !== null && vsBaseline >= 20, context: vsBaseline ? `↓ ${vsBaseline.toFixed(1)}% vs ${baseline.period_start.slice(0,4)} baseline` : undefined, progress: vsBaseline ? Math.min(vsBaseline / 20 * 100, 100) : 0, progressLabel: vsBaseline ? `${vsBaseline.toFixed(1)}% of 20% vs baseline` : 'Need 2+ periods' },
    vs_baseline_40pct:   { unlocked: vsBaseline !== null && vsBaseline >= 40, context: vsBaseline ? `↓ ${vsBaseline.toFixed(1)}% vs baseline` : undefined, progress: vsBaseline ? Math.min(vsBaseline / 40 * 100, 100) : 0, progressLabel: vsBaseline ? `${vsBaseline.toFixed(1)}% of 40% vs baseline` : 'Need 2+ periods' },
    scope1_reduced:      { unlocked: yoyScope1 !== null && yoyScope1 > 0 && latest.scope_1_t_co2e > 0, context: yoyScope1 ? `S1 ↓ ${yoyScope1.toFixed(1)}%` : undefined },
    scope2_reduced:      { unlocked: yoyScope2 !== null && yoyScope2 > 0 && prev!.scope_2_t_co2e > 0,  context: yoyScope2 ? `S2 ↓ ${yoyScope2.toFixed(1)}%` : undefined },
    scope3_reduced:      { unlocked: yoyScope3 !== null && yoyScope3 > 0 && prev!.scope_3_t_co2e > 0,  context: yoyScope3 ? `S3 ↓ ${yoyScope3.toFixed(1)}%` : undefined },
    scope2_zero:         { unlocked: latest.scope_2_t_co2e === 0 && latest.scope_1_t_co2e > 0, context: 'Scope 2 = 0 tCO2e' },
    two_year_streak:     { unlocked: streak >= 2, context: streak >= 2 ? `${streak} consecutive reductions` : undefined, progress: Math.min(streak / 2 * 100, 100), progressLabel: `${streak}/2 consecutive periods` },
    three_year_streak:   { unlocked: streak >= 3, context: streak >= 3 ? `${streak} year streak` : undefined, progress: Math.min(streak / 3 * 100, 100), progressLabel: `${streak}/3 consecutive periods` },
    five_year_streak:    { unlocked: streak >= 5, context: streak >= 5 ? `${streak} year streak` : undefined, progress: Math.min(streak / 5 * 100, 100), progressLabel: `${streak}/5 consecutive periods` },
    quality_improving:   { unlocked: qPrev !== null && qLatest > qPrev, context: qPrev ? `${qPrev} → ${qLatest}` : undefined },
    quality_90_two_years:{ unlocked: highQualityCount >= 2, context: `${highQualityCount} periods ≥ 90`, progress: Math.min(highQualityCount / 2 * 100, 100), progressLabel: `${highQualityCount}/2 periods with 90+ score` },
    all_scopes:          { unlocked: latest.scope_1_t_co2e > 0 && latest.scope_2_t_co2e > 0 && latest.scope_3_t_co2e > 0, context: 'S1 + S2 + S3 all reported' },
    scope3_added:        { unlocked: !!scope3Added, context: scope3Added ? 'S3 added vs prior period' : undefined },
    cat1_included:       { unlocked: latest.has_cat1, context: 'Cat 1 spend-based factors included' },
    coverage_expanding:  { unlocked: !!coverageExpanded, context: coverageExpanded ? 'More emission sources vs prior' : undefined },
    estimates_reducing:  { unlocked: !!estimatesReduced, context: estimatesReduced ? `${prev!.estimated_lines} → ${latest.estimated_lines} est. lines` : undefined },
    zero_estimates:      { unlocked: latest.estimated_lines === 0 && latest.data_quality_score > 0, context: '0 estimated lines' },
    report_shared:       { unlocked: periods.some(p => !!p.share_token), context: 'Report published' },
    three_periods:       { unlocked: n >= 3, progress: Math.min(n / 3 * 100, 100), progressLabel: `${n}/3 periods`, context: n >= 3 ? `${n} periods on record` : undefined },
    five_periods:        { unlocked: n >= 5, progress: Math.min(n / 5 * 100, 100), progressLabel: `${n}/5 periods`, context: n >= 5 ? `${n} periods on record` : undefined },
  }

  return ALL_ACHIEVEMENTS.map(a => {
    const c = checks[a.id] ?? { unlocked: false }
    return {
      ...a,
      unlocked:       c.unlocked,
      unlocked_at:    c.unlocked ? new Date().toISOString() : undefined,
      context:        c.context,
      progress:       c.unlocked ? 100 : (c.progress ?? 0),
      progress_label: c.unlocked ? undefined : c.progressLabel,
    }
  })
}

export function computeXP(achievements: Achievement[]): number {
  return achievements.filter(a => a.unlocked).reduce((s, a) => s + a.xp, 0)
}

export function buildOrgGamificationState(
  org_name: string,
  periods: PeriodSnapshot[],  // caller must sort oldest → newest
): OrgGamificationState {
  if (periods.length === 0) {
    const { level, next } = getLevelForXP(0)
    return { org_name, periods, latest: {} as PeriodSnapshot, baseline: null, xp: 0, level, next_level: next, xp_to_next: next?.min_xp ?? 0, xp_progress_pct: 0, achievements: ALL_ACHIEVEMENTS.map(a => ({ ...a, unlocked: false })), unlocked_count: 0, best_reduction_pct: null, total_abated_t: 0, consecutive_reductions: 0, quality_trend: null }
  }

  const latest   = periods[periods.length - 1]
  const baseline = periods.length > 1 ? periods[0] : null
  const achievements = computeOrgAchievements(periods)
  const xp           = computeXP(achievements)
  const { level, next } = getLevelForXP(xp)

  const xp_in_level = xp - level.min_xp
  const level_range = (next?.min_xp ?? level.min_xp + 1000) - level.min_xp
  const xp_to_next  = next ? next.min_xp - xp : 0
  const xp_pct      = Math.min(xp_in_level / level_range * 100, 100)

  // Best single-period YoY reduction
  let bestReduction: number | null = null
  for (let i = 1; i < periods.length; i++) {
    const prev = periods[i - 1]
    const curr = periods[i]
    if (prev.total_t_co2e > 0 && curr.total_t_co2e < prev.total_t_co2e) {
      const pct = (prev.total_t_co2e - curr.total_t_co2e) / prev.total_t_co2e * 100
      if (bestReduction === null || pct > bestReduction) bestReduction = pct
    }
  }

  // Total abated vs baseline
  const totalAbated = baseline ? Math.max(0, baseline.total_t_co2e - latest.total_t_co2e) : 0

  // Current streak
  let streak = 0
  for (let i = periods.length - 1; i >= 1; i--) {
    if (periods[i].total_t_co2e < periods[i - 1].total_t_co2e) streak++
    else break
  }

  // Quality trend
  const prev = periods.length >= 2 ? periods[periods.length - 2] : null
  let qualityTrend: OrgGamificationState['quality_trend'] = null
  if (prev) {
    const diff = latest.data_quality_score - prev.data_quality_score
    qualityTrend = diff > 2 ? 'improving' : diff < -2 ? 'declining' : 'stable'
  }

  return {
    org_name,
    periods,
    latest,
    baseline,
    xp,
    level,
    next_level: next,
    xp_to_next,
    xp_progress_pct: xp_pct,
    achievements,
    unlocked_count: achievements.filter(a => a.unlocked).length,
    best_reduction_pct: bestReduction,
    total_abated_t: totalAbated,
    consecutive_reductions: streak,
    quality_trend: qualityTrend,
  }
}
