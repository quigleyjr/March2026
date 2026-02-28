'use client'

import type { GapItem } from '@/types'

interface Props { gaps: GapItem[] }

const CONFIG = {
  critical: { colour: 'var(--red)',   bg: 'var(--red-light)',   icon: '⚠' },
  moderate: { colour: 'var(--amber)', bg: 'var(--amber-light)', icon: '◎' },
  minor:    { colour: 'var(--green)', bg: 'var(--green-light)', icon: '→' },
}

export function GapsPanel({ gaps }: Props) {
  const mono = { fontFamily: 'JetBrains Mono, monospace' }
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden',
    }}>
      <div style={{
        padding: '0.6rem 1.125rem',
        background: 'var(--surface-2)',
        borderBottom: '1px solid var(--border)',
      }}>
        <span style={{ ...mono, fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: 'var(--text-3)' }}>
          Compliance Gaps ({gaps.length})
        </span>
      </div>
      {gaps.map((gap, i) => {
        const { colour, bg, icon } = CONFIG[gap.severity]
        return (
          <div key={gap.code} style={{
            padding: '0.875rem 1.125rem',
            background: bg,
            borderBottom: i < gaps.length - 1 ? '1px solid var(--border)' : 'none',
            display: 'flex', gap: '0.75rem', alignItems: 'flex-start',
          }}>
            <span style={{ color: colour, fontSize: '0.9rem', flexShrink: 0, marginTop: 1 }}>{icon}</span>
            <div>
              <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.2rem' }}>{gap.message}</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-2)', lineHeight: 1.5 }}>{gap.recommendation}</p>
              <p style={{ ...mono, fontSize: '0.6rem', color: colour, marginTop: '0.35rem', letterSpacing: '0.06em' }}>
                {gap.severity.toUpperCase()} · {gap.code}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
