import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'
import { buildOrgGamificationState } from '@/lib/gamification'
import type { PeriodSnapshot } from '@/lib/gamification'

// GET /api/achievements?org=<name>
// Returns per-org gamification state based on that org's own historical periods
export async function GET(req: NextRequest) {
  try {
    const org = req.nextUrl.searchParams.get('org')
    if (!org) return NextResponse.json({ error: 'org parameter required' }, { status: 400 })

    // Fetch all periods for this org, sorted oldest → newest by period start
    const { data: calcs, error } = await supabase
      .from('calculations')
      .select('id, organisation_name, total_t_co2e, scope_1_t_co2e, scope_2_t_co2e, scope_3_t_co2e, data_quality_score, estimated_lines, factor_version, reporting_period_start, reporting_period_end, share_token, calculated_at, result_json')
      .eq('organisation_name', org)
      .order('reporting_period_start', { ascending: true })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Enrich each period with coverage metadata from result_json
    const periods: PeriodSnapshot[] = (calcs || []).map(c => {
      const rj = c.result_json as {
        lines?: { input?: { source_type?: string; site?: string }; category?: string }[]
      } | null

      let siteCount = 0
      let travelTypeCount = 0
      let hasCat1 = false

      if (rj?.lines) {
        const sites = new Set(rj.lines.filter(l => l.input?.site).map(l => l.input?.site))
        siteCount = sites.size

        const travelSources = ['flight_domestic','flight_short_haul','flight_long_haul','flight_long_haul_business','rail_national','grey_fleet_petrol','grey_fleet_diesel']
        const travelTypes = new Set(rj.lines.filter(l => travelSources.includes(l.input?.source_type ?? '')).map(l => l.input?.source_type))
        travelTypeCount = travelTypes.size

        hasCat1 = rj.lines.some(l => l.category === 'purchased_goods')
      }

      return {
        period_start:        c.reporting_period_start,
        period_end:          c.reporting_period_end,
        calculated_at:       c.calculated_at,
        total_t_co2e:        Number(c.total_t_co2e),
        scope_1_t_co2e:      Number(c.scope_1_t_co2e),
        scope_2_t_co2e:      Number(c.scope_2_t_co2e),
        scope_3_t_co2e:      Number(c.scope_3_t_co2e),
        data_quality_score:  c.data_quality_score,
        estimated_lines:     c.estimated_lines ?? 0,
        site_count:          siteCount,
        travel_type_count:   travelTypeCount,
        has_cat1:            hasCat1,
        has_scope3:          Number(c.scope_3_t_co2e) > 0,
        share_token:         c.share_token,
      }
    })

    // Deduplicate by period_start — keep most recently calculated one
    const deduped = Object.values(
      periods.reduce((acc, p) => {
        const key = p.period_start
        if (!acc[key] || p.calculated_at > acc[key].calculated_at) acc[key] = p
        return acc
      }, {} as Record<string, PeriodSnapshot>)
    ).sort((a, b) => a.period_start.localeCompare(b.period_start))

    const state = buildOrgGamificationState(org, deduped)
    return NextResponse.json({ state })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed' }, { status: 500 })
  }
}
