'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

type Calc = {
  id: string
  organisation_name: string
  reporting_period_start: string
  reporting_period_end: string
  total_t_co2e: number
  scope_1_t_co2e: number
  scope_2_t_co2e: number
  scope_3_t_co2e: number
  data_quality_score: number
  calculated_at: string
  factor_version: string
}

type GroupedOrg = {
  name: string
  calcs: Calc[]
}

function yoyChange(current: number, previous: number): { pct: number; direction: 'up' | 'down' | 'flat' } {
  if (previous === 0) return { pct: 0, direction: 'flat' }
  const pct = ((current - previous) / previous) * 100
  return { pct: Math.abs(pct), direction: pct > 0.5 ? 'up' : pct < -0.5 ? 'down' : 'flat' }
}

function TrendBadge({ current, previous }: { current: number; previous: number }) {
  const { pct, direction } = yoyChange(current, previous)
  if (direction === 'flat') return <span style={{ fontSize: '0.7rem', color: 'var(--text-3)', padding: '1px 6px', borderRadius: 9, background: 'var(--bg)', fontFamily: 'JetBrains Mono, monospace' }}>—</span>
  const isDown = direction === 'down'
  return (
    <span style={{
      fontSize: '0.7rem', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace',
      padding: '2px 7px', borderRadius: 9,
      background: isDown ? 'var(--green-light)' : 'var(--red-light)',
      color: isDown ? 'var(--green)' : 'var(--red)',
    }}>
      {isDown ? '↓' : '↑'} {pct.toFixed(1)}%
    </span>
  )
}

export default function HistoryPage() {
  const router = useRouter()
  const [calcs,     setCalcs]     = useState<Calc[]>([])
  const [loading,   setLoading]   = useState(true)
  const [reusing,   setReusing]   = useState<string | null>(null)
  const [sharing,   setSharing]   = useState<string | null>(null)
  const [shareUrls, setShareUrls] = useState<Record<string, string>>({})
  const [view,      setView]      = useState<'timeline' | 'grouped'>('grouped')
  const [search,    setSearch]    = useState('')

  useEffect(() => {
    fetch('/api/calculate')
      .then(r => r.json())
      .then(d => setCalcs(d.calculations || []))
      .finally(() => setLoading(false))
  }, [])

  const reuseCalculation = useCallback(async (id: string) => {
    setReusing(id)
    try {
      const res = await fetch(`/api/calculation/${id}`)
      const { result } = await res.json()
      if (!result) throw new Error('Not found')
      const userLines = result.lines.filter((l: { input: { notes?: string } }) => !l.input.notes?.startsWith('Auto WTT'))
      const template = {
        organisation_name: result.organisation_name,
        inputs: userLines.map((l: { input: { factor_id: string; quantity: number; unit: string; site?: string; estimated?: boolean; source_type: string } }) => ({
          factor_id: l.input.factor_id, source_type: l.input.source_type,
          quantity: l.input.quantity, unit: l.input.unit, site: l.input.site, estimated: l.input.estimated ?? false,
        })),
      }
      localStorage.setItem('reuse_template', JSON.stringify(template))
      router.push('/dashboard?reuse=1')
    } catch {
      setReusing(null)
      alert('Failed to load calculation')
    }
  }, [router])

  async function shareCalculation(id: string) {
    if (shareUrls[id]) {
      // already shared — copy link
      await navigator.clipboard.writeText(`${window.location.origin}${shareUrls[id]}`)
      return
    }
    setSharing(id)
    try {
      const res = await fetch('/api/share', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ calculation_id: id }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setShareUrls(prev => ({ ...prev, [id]: data.url }))
      await navigator.clipboard.writeText(`${window.location.origin}${data.url}`)
      alert('Share link copied to clipboard!')
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Share failed')
    } finally {
      setSharing(null)
    }
  }

  const mono: React.CSSProperties = { fontFamily: 'JetBrains Mono, monospace' }

  const filtered = calcs.filter(c => c.organisation_name.toLowerCase().includes(search.toLowerCase()))

  // Group by org name, sort calcs by period within each group
  const grouped: GroupedOrg[] = Object.values(
    filtered.reduce((acc, c) => {
      const k = c.organisation_name
      if (!acc[k]) acc[k] = { name: k, calcs: [] }
      acc[k].calcs.push(c)
      return acc
    }, {} as Record<string, GroupedOrg>)
  ).map(g => ({ ...g, calcs: g.calcs.sort((a, b) => a.reporting_period_start.localeCompare(b.reporting_period_start)) }))
   .sort((a, b) => {
     const latestA = a.calcs[a.calcs.length - 1].calculated_at
     const latestB = b.calcs[b.calcs.length - 1].calculated_at
     return latestB.localeCompare(latestA)
   })

  function CalcCard({ c, prevCalc, compact }: { c: Calc; prevCalc?: Calc; compact?: boolean }) {
    const total  = c.total_t_co2e
    const s1pct  = total > 0 ? (c.scope_1_t_co2e / total * 100) : 0
    const s2pct  = total > 0 ? (c.scope_2_t_co2e / total * 100) : 0
    const s3pct  = total > 0 ? (c.scope_3_t_co2e / total * 100) : 0
    const isReu  = reusing === c.id
    const isShr  = sharing === c.id
    const shared = !!shareUrls[c.id]

    return (
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius)', padding: compact ? '1rem' : '1.25rem',
        boxShadow: 'var(--shadow-sm)', transition: 'all 0.15s',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.6rem', gap: 8 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {!compact && <p style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.organisation_name}</p>}
            <p style={{ ...mono, fontSize: '0.68rem', color: 'var(--text-3)' }}>
              {c.reporting_period_start} → {c.reporting_period_end}
            </p>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>
              <p style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.25rem', fontWeight: 800, color: 'var(--green)' }}>{c.total_t_co2e.toFixed(2)}</p>
              {prevCalc && <TrendBadge current={c.total_t_co2e} previous={prevCalc.total_t_co2e} />}
            </div>
            <p style={{ ...mono, fontSize: '0.65rem', color: 'var(--text-3)' }}>tCO₂e</p>
          </div>
        </div>

        {/* Scope bar */}
        <div style={{ height: 5, background: 'var(--bg)', borderRadius: 3, overflow: 'hidden', marginBottom: '0.5rem', display: 'flex' }}>
          <div style={{ width: `${s1pct}%`, background: 'var(--green)' }} />
          <div style={{ width: `${s2pct}%`, background: 'var(--blue)' }} />
          <div style={{ width: `${s3pct}%`, background: 'var(--amber)' }} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <span style={{ ...mono, fontSize: '0.65rem', color: 'var(--green)' }}>S1 {c.scope_1_t_co2e.toFixed(2)}t</span>
          <span style={{ ...mono, fontSize: '0.65rem', color: 'var(--blue)' }}>S2 {c.scope_2_t_co2e.toFixed(2)}t</span>
          <span style={{ ...mono, fontSize: '0.65rem', color: 'var(--amber)' }}>S3 {c.scope_3_t_co2e.toFixed(2)}t</span>
          <span style={{ ...mono, fontSize: '0.65rem', color: 'var(--text-3)', marginLeft: 'auto' }}>Q {c.data_quality_score}/100</span>

          {/* Action buttons */}
          <button onClick={() => !reusing && reuseCalculation(c.id)} disabled={!!reusing}
            style={{ ...mono, fontSize: '0.65rem', padding: '2px 8px', background: 'var(--green-light)', color: 'var(--green)', border: '1px solid var(--border-strong)', borderRadius: 4, cursor: reusing ? 'wait' : 'pointer', fontWeight: 600 }}>
            {isReu ? '…' : 'Reuse'}
          </button>
          <button onClick={() => shareCalculation(c.id)} disabled={isShr}
            style={{ ...mono, fontSize: '0.65rem', padding: '2px 8px', background: shared ? 'var(--blue-light)' : 'var(--bg)', color: shared ? 'var(--blue)' : 'var(--text-3)', border: '1px solid var(--border)', borderRadius: 4, cursor: 'pointer', fontWeight: 600 }}>
            {isShr ? '…' : shared ? '🔗 Copy link' : 'Share'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <nav style={{ background: 'var(--white)', borderBottom: '1px solid var(--border)', padding: '0 2rem', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50, boxShadow: 'var(--shadow-sm)' }}>
        <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1rem', color: 'var(--text)' }}>
          Fresh<span style={{ color: 'var(--green)' }}>ESG</span>
        </span>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {[['/', 'Home'], ['/dashboard', 'Calculator'], ['/import', 'Import'], ['/achievements', 'Achievements']].map(([href, label]) => (
            <button key={href} onClick={() => router.push(href)} style={{ ...mono, fontSize: '0.72rem', color: 'var(--text-3)', background: 'none', border: '1px solid var(--border)', padding: '0.3rem 0.75rem', borderRadius: 'var(--radius-xs)', cursor: 'pointer' }}>{label}</button>
          ))}
        </div>
      </nav>

      <main style={{ maxWidth: 960, margin: '0 auto', padding: '2rem 1.5rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.5rem', color: 'var(--text)', marginBottom: '0.25rem' }}>Calculation History</h1>
            <p style={{ color: 'var(--text-3)', fontSize: '0.875rem' }}>
              {calcs.length} calculations · {Object.keys(grouped).length} organisations
            </p>
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              type="text" placeholder="Search organisations…" value={search} onChange={e => setSearch(e.target.value)}
              style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-xs)', background: 'var(--surface)', color: 'var(--text)', outline: 'none', width: 200, fontFamily: 'inherit' }}
            />
            <div style={{ display: 'flex', border: '1px solid var(--border)', borderRadius: 'var(--radius-xs)', overflow: 'hidden' }}>
              {(['grouped', 'timeline'] as const).map(v => (
                <button key={v} onClick={() => setView(v)} style={{
                  ...mono, fontSize: '0.7rem', padding: '0.35rem 0.75rem', border: 'none',
                  background: view === v ? 'var(--green)' : 'var(--surface)',
                  color: view === v ? '#fff' : 'var(--text-3)', cursor: 'pointer', fontWeight: 600,
                }}>
                  {v === 'grouped' ? '⊞ By org' : '≡ Timeline'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading && <p style={{ color: 'var(--text-3)' }}>Loading…</p>}
        {!loading && calcs.length === 0 && <p style={{ color: 'var(--text-3)' }}>No calculations yet. Run one from the calculator.</p>}

        {/* Grouped view — YoY comparison */}
        {view === 'grouped' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {grouped.map(group => (
              <div key={group.name} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
                {/* Org header */}
                <div style={{ padding: '0.875rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fafcfa' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{group.name}</span>
                    <span style={{ ...mono, fontSize: '0.65rem', color: 'var(--text-3)', padding: '1px 6px', background: 'var(--bg)', borderRadius: 9 }}>
                      {group.calcs.length} period{group.calcs.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  {/* YoY summary if 2+ periods */}
                  {group.calcs.length >= 2 && (() => {
                    const latest = group.calcs[group.calcs.length - 1]
                    const prev   = group.calcs[group.calcs.length - 2]
                    const { pct, direction } = yoyChange(latest.total_t_co2e, prev.total_t_co2e)
                    return (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>Latest vs previous:</span>
                        <span style={{
                          fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', fontWeight: 700,
                          padding: '2px 8px', borderRadius: 9,
                          background: direction === 'down' ? 'var(--green-light)' : direction === 'up' ? 'var(--red-light)' : 'var(--bg)',
                          color: direction === 'down' ? 'var(--green)' : direction === 'up' ? 'var(--red)' : 'var(--text-3)',
                        }}>
                          {direction === 'flat' ? '—' : (direction === 'down' ? '↓ ' : '↑ ') + pct.toFixed(1) + '%'}
                        </span>
                      </div>
                    )
                  })()}
                </div>

                {/* Period cards in a row */}
                <div style={{ padding: '1rem 1.25rem', display: 'grid', gridTemplateColumns: `repeat(${Math.min(group.calcs.length, 3)}, 1fr)`, gap: '0.75rem' }}>
                  {group.calcs.map((c, i) => (
                    <CalcCard key={c.id} c={c} prevCalc={i > 0 ? group.calcs[i - 1] : undefined} compact />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Timeline view */}
        {view === 'timeline' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[...filtered].sort((a, b) => b.calculated_at.localeCompare(a.calculated_at)).map(c => (
              <CalcCard key={c.id} c={c} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
