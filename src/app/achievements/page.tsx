'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import type { OrgGamificationState, Achievement } from '@/lib/gamification'
import { LEVELS } from '@/lib/gamification'

const RARITY: Record<string, { bg: string; border: string; label: string; text: string }> = {
  common:    { bg: '#f6f8f5', border: '#c8d8c4', label: '#6a8267', text: '#2a3a28' },
  rare:      { bg: '#eaf0f9', border: '#a8c0e8', label: '#1a4d8c', text: '#0f2d5c' },
  epic:      { bg: '#f3eafc', border: '#c8a8e8', label: '#6b2fa0', text: '#3d1a5e' },
  legendary: { bg: '#fef9ec', border: '#e8c97a', label: '#b87a00', text: '#6b4800' },
}

const CAT_LABEL: Record<string, string> = {
  reduction:    '📉 Reductions',
  consistency:  '📆 Consistency',
  coverage:     '🔭 Coverage',
  quality:      '📏 Data Quality',
  transparency: '🔓 Transparency',
}

function AchievementCard({ a }: { a: Achievement }) {
  const r = RARITY[a.rarity]
  return (
    <div style={{
      background: a.unlocked ? r.bg : '#fafafa',
      border: `1px solid ${a.unlocked ? r.border : '#e4eae2'}`,
      borderRadius: 10,
      padding: '0.875rem',
      opacity: a.unlocked ? 1 : 0.6,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* locked texture */}
      {!a.unlocked && (
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(135deg, transparent, transparent 5px, rgba(0,0,0,0.015) 5px, rgba(0,0,0,0.015) 10px)', pointerEvents: 'none' }} />
      )}

      <div style={{ display: 'flex', gap: '0.7rem', alignItems: 'flex-start' }}>
        <span style={{ fontSize: '1.6rem', lineHeight: 1, filter: a.unlocked ? 'none' : 'grayscale(1) opacity(0.4)', flexShrink: 0 }}>{a.icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.2rem' }}>
            <span style={{ fontWeight: 700, fontSize: '0.82rem', color: a.unlocked ? r.text : '#4a5e46' }}>{a.name}</span>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.52rem', fontWeight: 700, padding: '1px 5px', borderRadius: 8, background: a.unlocked ? r.border : '#e4eae2', color: a.unlocked ? r.label : '#8a9e86', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{a.rarity}</span>
            {a.unlocked && (
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6rem', fontWeight: 700, marginLeft: 'auto', color: r.label }}>+{a.xp} XP</span>
            )}
          </div>
          <p style={{ fontSize: '0.73rem', color: '#6a8267', lineHeight: 1.5, marginBottom: '0.4rem' }}>{a.description}</p>

          {/* Context — what specifically happened */}
          {a.unlocked && a.context && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: r.border + '66', padding: '2px 8px', borderRadius: 9, fontFamily: 'JetBrains Mono, monospace', fontSize: '0.62rem', color: r.label, fontWeight: 700 }}>
              {a.context}
            </div>
          )}

          {/* Progress bar for locked */}
          {!a.unlocked && a.progress !== undefined && a.progress > 0 && (
            <div>
              <div style={{ height: 4, background: '#e4eae2', borderRadius: 2, overflow: 'hidden', marginBottom: '0.25rem' }}>
                <div style={{ width: `${a.progress}%`, height: '100%', background: '#4ca66a', borderRadius: 2, transition: 'width 0.6s ease' }} />
              </div>
              {a.progress_label && <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6rem', color: '#8a9e86' }}>{a.progress_label}</p>}
            </div>
          )}
          {!a.unlocked && (!a.progress || a.progress === 0) && (
            <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6rem', color: '#c8d8c4' }}>Locked</p>
          )}
        </div>
      </div>
    </div>
  )
}

function AchievementsInner() {
  const router      = useRouter()
  const params      = useSearchParams()
  const [orgs,      setOrgs]   = useState<string[]>([])
  const [org,       setOrg]    = useState<string>(params.get('org') ?? '')
  const [state,     setState]  = useState<OrgGamificationState | null>(null)
  const [loading,   setLoading] = useState(false)
  const [catFilter, setCat]    = useState('all')

  // Load org list from history
  useEffect(() => {
    fetch('/api/calculate')
      .then(r => r.json())
      .then(d => {
        const names: string[] = Array.from(new Set(
          (d.calculations ?? []).map((c: { organisation_name: string }) => c.organisation_name)
        ))
        setOrgs(names)
        if (!org && names.length > 0) setOrg(names[0])
      })
  }, [])

  useEffect(() => {
    if (!org) return
    setLoading(true)
    fetch(`/api/achievements?org=${encodeURIComponent(org)}`)
      .then(r => r.json())
      .then(d => setState(d.state ?? null))
      .finally(() => setLoading(false))
  }, [org])

  const mono: React.CSSProperties = { fontFamily: 'JetBrains Mono, monospace' }

  // Chart data — one bar per period
  const chartData = state?.periods.map(p => ({
    label: p.period_start.slice(0, 4),
    total: +p.total_t_co2e.toFixed(2),
    s1:    +p.scope_1_t_co2e.toFixed(2),
    s2:    +p.scope_2_t_co2e.toFixed(2),
    s3:    +p.scope_3_t_co2e.toFixed(2),
    quality: p.data_quality_score,
  })) ?? []

  const baselineVal = state?.baseline?.total_t_co2e

  const filteredAchievements = (state?.achievements ?? []).filter(
    a => catFilter === 'all' || a.category === catFilter
  )
  const categories = ['reduction', 'consistency', 'coverage', 'quality', 'transparency'] as const

  // Sort: unlocked first, then by progress desc
  const sorted = [...filteredAchievements].sort((a, b) => {
    if (a.unlocked && !b.unlocked) return -1
    if (!a.unlocked && b.unlocked) return 1
    return (b.progress ?? 0) - (a.progress ?? 0)
  })

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

      {/* Nav */}
      <nav style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '0 1.5rem', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50, boxShadow: 'var(--shadow-sm)' }}>
        <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1rem' }}>
          Fresh<span style={{ color: 'var(--green)' }}>ESG</span>
        </span>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {[['/', 'Home'], ['/dashboard', 'Calculator'], ['/history', 'History']].map(([href, label]) => (
            <button key={href} onClick={() => router.push(href)} style={{ ...mono, fontSize: '0.72rem', color: 'var(--text-3)', background: 'none', border: '1px solid var(--border)', padding: '0.3rem 0.75rem', borderRadius: 'var(--radius-xs)', cursor: 'pointer' }}>{label}</button>
          ))}
        </div>
      </nav>

      <main style={{ maxWidth: 1000, margin: '0 auto', padding: '1.5rem' }}>

        {/* Org selector */}
        <div style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.4rem', lineHeight: 1.1 }}>ESG Progress</h1>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-3)', marginTop: '0.2rem' }}>Achievements based on this organisation&apos;s own history</p>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <select value={org} onChange={e => setOrg(e.target.value)} style={{ ...mono, fontSize: '0.8rem', padding: '0.45rem 0.875rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--surface)', color: 'var(--text)', cursor: 'pointer', outline: 'none', minWidth: 220 }}>
              {orgs.length === 0 && <option value="">No organisations yet</option>}
              {orgs.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        </div>

        {loading && <p style={{ ...mono, color: 'var(--text-3)', fontSize: '0.8rem' }}>Computing progress for {org}…</p>}

        {!loading && state && state.periods.length === 0 && (
          <div style={{ padding: '2rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', textAlign: 'center' }}>
            <p style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>🌱</p>
            <p style={{ fontWeight: 700, marginBottom: '0.25rem' }}>No periods recorded yet</p>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-3)' }}>Run a calculation for {org} to start tracking progress</p>
          </div>
        )}

        {!loading && state && state.periods.length >= 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            {/* Level hero */}
            <div style={{ background: '#141a12', borderRadius: 'var(--radius)', padding: '1.5rem 1.75rem', display: 'flex', gap: '1.5rem', alignItems: 'stretch', flexWrap: 'wrap', position: 'relative', overflow: 'hidden' }}>
              {/* Grid bg */}
              <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)', backgroundSize: '28px 28px', pointerEvents: 'none' }} />

              {/* Level badge */}
              <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minWidth: 90, background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '1rem 0.75rem', gap: '0.4rem', border: `1px solid ${state.level.colour}44` }}>
                <div style={{ width: 52, height: 52, borderRadius: 12, background: state.level.colour, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.4rem', color: '#fff', boxShadow: `0 0 20px ${state.level.colour}55` }}>
                  {state.level.level}
                </div>
                <span style={{ ...mono, fontSize: '0.58rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'center' }}>Level</span>
              </div>

              {/* Level info + XP bar */}
              <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
                <p style={{ ...mono, fontSize: '0.6rem', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.3rem' }}>{org}</p>
                <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.5rem', color: '#fff', lineHeight: 1 }}>{state.level.title}</p>
                <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.3rem', marginBottom: '0.875rem' }}>{state.level.description}</p>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <span style={{ ...mono, fontSize: '0.65rem', color: 'rgba(255,255,255,0.45)' }}>{state.xp.toLocaleString()} XP</span>
                  {state.next_level && <span style={{ ...mono, fontSize: '0.65rem', color: 'rgba(255,255,255,0.25)' }}>{state.xp_to_next} XP → {state.next_level.title}</span>}
                </div>
                <div style={{ height: 7, background: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ width: `${state.xp_progress_pct}%`, height: '100%', background: `linear-gradient(90deg, ${state.level.colour}, ${state.level.colour}bb)`, borderRadius: 4, transition: 'width 0.8s ease', boxShadow: `0 0 8px ${state.level.colour}88` }} />
                </div>

                {/* Level path */}
                <div style={{ display: 'flex', gap: '0.25rem', marginTop: '0.875rem', flexWrap: 'wrap' }}>
                  {LEVELS.map(l => (
                    <div key={l.level} title={l.title} style={{ width: 22, height: 22, borderRadius: 5, background: state.xp >= l.min_xp ? l.colour : 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.55rem', fontWeight: 700, color: state.xp >= l.min_xp ? '#fff' : 'rgba(255,255,255,0.2)', cursor: 'default' }}>
                      {l.level}
                    </div>
                  ))}
                </div>
              </div>

              {/* Key stats */}
              <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', alignContent: 'center' }}>
                {[
                  { label: 'Achievements', val: `${state.unlocked_count}/${state.achievements.length}`, col: '#4ca66a' },
                  { label: 'Best reduction', val: state.best_reduction_pct ? `↓ ${state.best_reduction_pct.toFixed(1)}%` : '—', col: '#4ca66a' },
                  { label: 'tCO₂e abated', val: state.total_abated_t > 0 ? `${state.total_abated_t.toFixed(1)}t` : '—', col: '#4ca66a' },
                  { label: 'Reduction streak', val: state.consecutive_reductions > 0 ? `${state.consecutive_reductions} period${state.consecutive_reductions !== 1 ? 's' : ''}` : '—', col: state.consecutive_reductions >= 3 ? '#f0c040' : '#4ca66a' },
                ].map(s => (
                  <div key={s.label} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: '0.6rem 0.75rem', minWidth: 110 }}>
                    <p style={{ ...mono, fontSize: '0.58rem', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.2rem' }}>{s.label}</p>
                    <p style={{ ...mono, fontSize: '0.95rem', fontWeight: 700, color: s.col }}>{s.val}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Emissions timeline */}
            {chartData.length >= 2 && (
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1.25rem', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1rem' }}>
                  <p style={{ ...mono, fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-3)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Emissions History</p>
                  {state.baseline && (
                    <p style={{ ...mono, fontSize: '0.65rem', color: 'var(--text-3)' }}>
                      Baseline ({state.baseline.period_start.slice(0,4)}): {state.baseline.total_t_co2e.toFixed(1)}t
                      {state.total_abated_t > 0 && <span style={{ color: 'var(--green)', marginLeft: '0.75rem' }}>↓ {state.total_abated_t.toFixed(1)}t removed</span>}
                    </p>
                  )}
                </div>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={chartData} barSize={28} barCategoryGap="30%">
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip
                      formatter={(v: number, name: string) => [`${v.toFixed(2)} tCO₂e`, name === 'total' ? 'Total' : name.toUpperCase()]}
                      contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid var(--border)', padding: '8px 12px' }}
                    />
                    {baselineVal && <ReferenceLine y={baselineVal} stroke="#b87a00" strokeDasharray="4 3" strokeWidth={1.5} label={{ value: 'Baseline', position: 'insideTopRight', fontSize: 10, fill: '#b87a00' }} />}
                    <Bar dataKey="total" fill="var(--green)" radius={[4,4,0,0]} opacity={0.85} />
                  </BarChart>
                </ResponsiveContainer>

                {/* Period-by-period YoY deltas */}
                {chartData.length >= 2 && (
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.875rem', flexWrap: 'wrap' }}>
                    {chartData.map((d, i) => {
                      if (i === 0) return <div key={d.label} style={{ ...mono, fontSize: '0.65rem', color: 'var(--text-3)', padding: '3px 8px', background: 'var(--bg)', borderRadius: 8 }}>{d.label}: baseline</div>
                      const prev = chartData[i - 1]
                      const pct  = (prev.total - d.total) / prev.total * 100
                      const up   = pct > 0
                      return (
                        <div key={d.label} style={{ ...mono, fontSize: '0.65rem', fontWeight: 700, padding: '3px 8px', background: up ? 'var(--green-light)' : 'var(--red-light)', color: up ? 'var(--green)' : 'var(--red)', borderRadius: 8 }}>
                          {d.label}: {up ? '↓' : '↑'} {Math.abs(pct).toFixed(1)}%
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Single period — no history yet */}
            {chartData.length === 1 && (
              <div style={{ background: 'var(--amber-light)', border: '1px solid #e8c97a', borderRadius: 'var(--radius-sm)', padding: '0.875rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span>💡</span>
                <p style={{ fontSize: '0.8rem', color: 'var(--amber)' }}>
                  <strong>Baseline recorded.</strong> Add a second reporting period to unlock reduction achievements and start tracking your progress.
                </p>
              </div>
            )}

            {/* Achievements */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1.25rem', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <p style={{ ...mono, fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-3)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  Achievements — {state.unlocked_count} of {state.achievements.length} unlocked
                </p>
                {/* Category filter */}
                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                  {['all', ...categories].map(cat => (
                    <button key={cat} onClick={() => setCat(cat)} style={{
                      ...mono, fontSize: '0.65rem', padding: '0.25rem 0.7rem', border: '1px solid var(--border)',
                      borderRadius: 12, background: catFilter === cat ? 'var(--green)' : 'var(--bg)',
                      color: catFilter === cat ? '#fff' : 'var(--text-3)', cursor: 'pointer', fontWeight: 600,
                    }}>
                      {cat === 'all' ? 'All' : CAT_LABEL[cat]}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: '0.65rem' }}>
                {sorted.map(a => <AchievementCard key={a.id} a={a} />)}
              </div>
            </div>

          </div>
        )}
      </main>
    </div>
  )
}

export default function AchievementsPage() {
  return <Suspense fallback={<div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p style={{ fontFamily: 'JetBrains Mono, monospace', color: '#8a9e86', fontSize: '0.8rem' }}>Loading…</p></div>}><AchievementsInner /></Suspense>
}
