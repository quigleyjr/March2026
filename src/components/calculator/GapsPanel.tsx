'use client'

import type { GapItem } from '@/types'

const SEVERITY_CONFIG = {
  critical: { bg: 'var(--red-light)',   border: 'rgba(184,50,50,0.2)',   color: 'var(--red)',   icon: '⚠' },
  moderate: { bg: 'var(--amber-light)', border: 'rgba(184,122,0,0.2)',   color: 'var(--amber)', icon: '◎' },
  minor:    { bg: 'var(--green-light)', border: 'rgba(26,122,60,0.15)',  color: 'var(--green)', icon: '○' },
}

export function GapsPanel({ gaps }: { gaps: GapItem[] }) {
  if (!gaps.length) return null
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1.25rem', boxShadow: 'var(--shadow-sm)' }}>
      <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-3)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.875rem' }}>
        Data Gaps · {gaps.length}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {gaps.map(gap => {
          const cfg = SEVERITY_CONFIG[gap.severity]
          return (
            <div key={gap.code} style={{ padding: '0.75rem 1rem', background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: 'var(--radius-sm)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                <span style={{ color: cfg.color, fontSize: '0.875rem', lineHeight: 1.4 }}>{cfg.icon}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '0.8rem', fontWeight: 600, color: cfg.color, marginBottom: '0.2rem' }}>{gap.message}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-2)', lineHeight: 1.4 }}>{gap.recommendation}</p>
                </div>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6rem', color: cfg.color, background: 'rgba(255,255,255,0.6)', padding: '0.1rem 0.4rem', borderRadius: 4, whiteSpace: 'nowrap' }}>{gap.code}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
