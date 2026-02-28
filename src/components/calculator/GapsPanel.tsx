'use client'

import type { GapItem } from '@/types'

interface Props { gaps: GapItem[] }

const CONFIG = {
  critical: { colour: '#c45c2a', bg: 'rgba(196,92,42,0.07)', icon: '⚠' },
  moderate: { colour: '#d4a843', bg: 'rgba(212,168,67,0.07)', icon: '◎' },
  minor:    { colour: '#5a7a54', bg: 'rgba(90,122,84,0.07)',  icon: '→' },
}

export function GapsPanel({ gaps }: Props) {
  return (
    <div style={{ background: 'white', border: '1px solid rgba(45,90,39,0.15)', borderRadius: 4, overflow: 'hidden' }}>
      <div style={{ padding: '0.75rem 1rem', background: '#e8ede4', borderBottom: '1px solid rgba(45,90,39,0.1)' }}>
        <p style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.7rem', color: '#5a7a54', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Compliance Gaps ({gaps.length})
        </p>
      </div>
      {gaps.map((gap) => {
        const { colour, bg, icon } = CONFIG[gap.severity]
        return (
          <div key={gap.code} style={{ padding: '0.75rem 1rem', background: bg, borderBottom: '1px solid rgba(45,90,39,0.06)', display: 'flex', gap: '0.75rem' }}>
            <span style={{ color: colour, flexShrink: 0, fontSize: '0.9rem' }}>{icon}</span>
            <div>
              <p style={{ fontSize: '0.875rem', fontWeight: 500, color: '#0e1a12', marginBottom: '0.2rem' }}>{gap.message}</p>
              <p style={{ fontSize: '0.8rem', color: '#0e1a12', opacity: 0.6 }}>{gap.recommendation}</p>
              <p style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.6rem', color: colour, marginTop: '0.3rem', letterSpacing: '0.06em' }}>
                {gap.severity.toUpperCase()} · {gap.code}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
