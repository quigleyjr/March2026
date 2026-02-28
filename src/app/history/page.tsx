'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface CalcSummary {
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

export default function HistoryPage() {
  const router = useRouter()
  const [calcs, setCalcs] = useState<CalcSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/calculate')
      .then(r => r.json())
      .then(d => { setCalcs(d.calculations || []); setLoading(false) })
      .catch(() => { setError('Failed to load calculations'); setLoading(false) })
  }, [])

  const nav = {
    background: 'var(--white)', borderBottom: '1px solid var(--border)',
    padding: '0 2rem', height: 56,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    boxShadow: 'var(--shadow-sm)', position: 'sticky' as const, top: 0, zIndex: 50,
  }

  const mono = { fontFamily: 'JetBrains Mono, monospace' }
  const label = { ...mono, fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: 'var(--text-3)' }

  const qualityColour = (score: number) => score >= 80 ? 'var(--green)' : score >= 50 ? 'var(--amber)' : 'var(--red)'

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <nav style={nav}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: 28, height: 28, background: 'var(--green)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 2L9.5 6H4.5L7 2Z" fill="white"/><path d="M2 9.5C2 7.5 4.5 6 7 6C9.5 6 12 7.5 12 9.5C12 11.5 9.5 12 7 12C4.5 12 2 11.5 2 9.5Z" fill="white" opacity="0.6"/></svg>
          </div>
          <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1rem', color: 'var(--text)' }}>
            February<span style={{ color: 'var(--green)' }}>2026</span>
          </span>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button onClick={() => router.push('/dashboard')}
            style={{ ...mono, fontSize: '0.75rem', color: 'var(--text-3)', background: 'none', border: 'none', cursor: 'pointer' }}>
            ← Calculator
          </button>
          <button onClick={() => router.push('/dashboard')}
            style={{ padding: '0.4rem 0.875rem', fontSize: '0.8rem', fontWeight: 700, background: 'var(--green)', color: 'white', border: 'none', borderRadius: 'var(--radius-xs)', cursor: 'pointer' }}>
            + New calculation
          </button>
        </div>
      </nav>

      <main style={{ maxWidth: 1000, margin: '0 auto', padding: '2rem 1.5rem' }}>
        <div style={{ marginBottom: '1.75rem' }}>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.75rem', letterSpacing: '-0.02em', color: 'var(--text)' }}>
            Calculation History
          </h1>
          <p style={{ color: 'var(--text-3)', fontSize: '0.875rem', marginTop: '0.3rem' }}>
            {calcs.length} calculation{calcs.length !== 1 ? 's' : ''} saved · All calculations include full audit trails
          </p>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-3)', ...mono, fontSize: '0.8rem' }}>
            Loading…
          </div>
        )}

        {error && (
          <div style={{ padding: '1rem', background: 'var(--red-light)', color: 'var(--red)', borderRadius: 'var(--radius-sm)', ...mono, fontSize: '0.8rem' }}>
            {error}
          </div>
        )}

        {!loading && calcs.length === 0 && (
          <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-sm)' }}>
            <p style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>📊</p>
            <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.5rem' }}>No calculations yet</p>
            <p style={{ color: 'var(--text-3)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>Run your first emissions calculation to see it here.</p>
            <button onClick={() => router.push('/dashboard')}
              style={{ padding: '0.6rem 1.25rem', fontWeight: 700, background: 'var(--green)', color: 'white', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}>
              Start calculating
            </button>
          </div>
        )}

        {calcs.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {calcs.map((calc) => {
              const total = calc.scope_1_t_co2e + calc.scope_2_t_co2e + calc.scope_3_t_co2e
              const s1pct = total > 0 ? (calc.scope_1_t_co2e / total * 100) : 0
              const s2pct = total > 0 ? (calc.scope_2_t_co2e / total * 100) : 0
              const s3pct = total > 0 ? (calc.scope_3_t_co2e / total * 100) : 0
              return (
                <div key={calc.id} style={{
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)', padding: '1.25rem 1.5rem',
                  boxShadow: 'var(--shadow-sm)',
                  display: 'grid', gridTemplateColumns: '1fr auto',
                  gap: '1rem', alignItems: 'center',
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                      <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1rem', color: 'var(--text)' }}>
                        {calc.organisation_name}
                      </span>
                      <span style={{ ...mono, fontSize: '0.65rem', color: 'var(--text-3)', background: 'var(--surface-2)', padding: '0.2rem 0.5rem', borderRadius: 20 }}>
                        {calc.reporting_period_start} → {calc.reporting_period_end}
                      </span>
                    </div>

                    {/* Scope bar */}
                    <div style={{ display: 'flex', height: 6, borderRadius: 3, overflow: 'hidden', background: 'var(--border)', marginBottom: '0.5rem', maxWidth: 400 }}>
                      <div style={{ width: `${s1pct}%`, background: 'var(--green)', transition: 'width 0.3s' }} />
                      <div style={{ width: `${s2pct}%`, background: 'var(--blue)', transition: 'width 0.3s' }} />
                      <div style={{ width: `${s3pct}%`, background: 'var(--amber)', transition: 'width 0.3s' }} />
                    </div>

                    <div style={{ display: 'flex', gap: '1.25rem' }}>
                      {[
                        { label: 'S1', val: calc.scope_1_t_co2e, colour: 'var(--green)' },
                        { label: 'S2', val: calc.scope_2_t_co2e, colour: 'var(--blue)' },
                        { label: 'S3', val: calc.scope_3_t_co2e, colour: 'var(--amber)' },
                      ].map(s => (
                        <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <div style={{ width: 8, height: 8, borderRadius: 2, background: s.colour }} />
                          <span style={{ ...mono, fontSize: '0.68rem', color: 'var(--text-3)' }}>{s.label} {s.val.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                    <div>
                      <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.75rem', color: 'var(--text)', letterSpacing: '-0.02em' }}>
                        {calc.total_t_co2e.toLocaleString('en-GB', { maximumFractionDigits: 2 })}
                      </span>
                      <span style={{ ...mono, fontSize: '0.7rem', color: 'var(--text-3)', marginLeft: '0.35rem' }}>tCO₂e</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ ...mono, fontSize: '0.65rem', color: qualityColour(calc.data_quality_score) }}>
                        Q: {calc.data_quality_score}/100
                      </span>
                      <span style={{ ...mono, fontSize: '0.6rem', color: 'var(--text-3)' }}>
                        {new Date(calc.calculated_at).toLocaleDateString('en-GB')}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
