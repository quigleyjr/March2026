'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { OrgProfile } from '@/types'

const SECTORS = [
  'Manufacturing', 'Professional Services', 'Retail', 'Logistics & Transport',
  'Construction', 'Hospitality', 'Healthcare', 'Technology', 'Financial Services',
  'Education', 'Energy & Utilities', 'Agriculture', 'Other',
]

const steps = ['Organisation', 'Sites', 'Metrics', 'Review']

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [profile, setProfile] = useState<OrgProfile>({
    name: '', sector: '', employees: undefined, revenue_m: undefined, floor_area_m2: undefined, sites: [''],
  })
  const [newSite, setNewSite] = useState('')

  function update(field: keyof OrgProfile, value: unknown) {
    setProfile(p => ({ ...p, [field]: value }))
  }

  function addSite() {
    if (newSite.trim()) {
      update('sites', [...profile.sites.filter(Boolean), newSite.trim()])
      setNewSite('')
    }
  }

  function removeSite(i: number) {
    update('sites', profile.sites.filter((_, idx) => idx !== i))
  }

  function finish() {
    localStorage.setItem('org_profile', JSON.stringify(profile))
    router.push('/dashboard')
  }

  const nav = {
    background: 'var(--white)', borderBottom: '1px solid var(--border)',
    padding: '0 2rem', height: 56,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    boxShadow: 'var(--shadow-sm)',
  }

  const card = {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius)', padding: '2rem', boxShadow: 'var(--shadow)',
    maxWidth: 560, margin: '0 auto',
  }

  const input = {
    width: '100%', padding: '0.6rem 0.875rem', fontSize: '0.9rem',
    border: '1px solid var(--border)', borderRadius: 'var(--radius-xs)',
    background: 'var(--bg)', color: 'var(--text)', outline: 'none',
    fontFamily: 'Plus Jakarta Sans, sans-serif',
  }

  const label = {
    display: 'block' as const, fontSize: '0.75rem', fontWeight: 700,
    color: 'var(--text-2)', marginBottom: '0.4rem', letterSpacing: '0.01em',
  }

  const btnPrimary = {
    padding: '0.7rem 1.5rem', fontSize: '0.9rem', fontWeight: 700,
    background: 'var(--green)', color: 'white', border: 'none',
    borderRadius: 'var(--radius-sm)', cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(26,122,60,0.25)',
  }

  const btnSecondary = {
    padding: '0.7rem 1.5rem', fontSize: '0.9rem', fontWeight: 600,
    background: 'var(--surface)', color: 'var(--text-2)',
    border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
  }

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
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.7rem', color: 'var(--text-3)' }}>
          Setup {step + 1} of {steps.length}
        </span>
      </nav>

      <main style={{ maxWidth: 640, margin: '3rem auto', padding: '0 1.5rem' }}>

        {/* Progress */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2.5rem' }}>
          {steps.map((s, i) => (
            <div key={s} style={{ flex: 1 }}>
              <div style={{
                height: 3, borderRadius: 2, marginBottom: '0.4rem',
                background: i <= step ? 'var(--green)' : 'var(--border)',
                transition: 'background 0.3s',
              }} />
              <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.62rem', color: i <= step ? 'var(--green)' : 'var(--text-3)', letterSpacing: '0.06em' }}>
                {s.toUpperCase()}
              </p>
            </div>
          ))}
        </div>

        {/* Step 0 — Organisation */}
        {step === 0 && (
          <div style={card}>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.5rem', marginBottom: '0.4rem', letterSpacing: '-0.02em' }}>
              Tell us about your organisation
            </h2>
            <p style={{ color: 'var(--text-3)', fontSize: '0.875rem', marginBottom: '1.75rem' }}>
              This information is used to set up your emissions profile and intensity metrics.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={label}>Company name *</label>
                <input style={input} value={profile.name} onChange={e => update('name', e.target.value)} placeholder="e.g. Acme Ltd" />
              </div>
              <div>
                <label style={label}>Companies House number (optional)</label>
                <input style={input} value={profile.companies_house || ''} onChange={e => update('companies_house', e.target.value)} placeholder="e.g. 12345678" />
              </div>
              <div>
                <label style={label}>Sector *</label>
                <select style={{ ...input, background: 'var(--surface)' }} value={profile.sector} onChange={e => update('sector', e.target.value)}>
                  <option value="">Select sector…</option>
                  {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button style={btnPrimary} disabled={!profile.name || !profile.sector}
                onClick={() => setStep(1)}>
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* Step 1 — Sites */}
        {step === 1 && (
          <div style={card}>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.5rem', marginBottom: '0.4rem', letterSpacing: '-0.02em' }}>
              Add your sites
            </h2>
            <p style={{ color: 'var(--text-3)', fontSize: '0.875rem', marginBottom: '1.75rem' }}>
              List each location where your organisation operates. You'll tag emission sources to sites when calculating.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
              {profile.sites.filter(Boolean).map((site, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 0.875rem', background: 'var(--green-light)', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-xs)' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--green)' }}>📍 {site}</span>
                  <button onClick={() => removeSite(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', fontSize: '0.8rem' }}>✕</button>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input style={{ ...input, flex: 1 }} value={newSite} onChange={e => setNewSite(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSite())}
                placeholder="e.g. London HQ, Manchester Warehouse…" />
              <button onClick={addSite} style={{ ...btnPrimary, padding: '0.6rem 1rem', fontSize: '0.85rem', flexShrink: 0 }}>Add</button>
            </div>

            <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem', color: 'var(--text-3)', marginTop: '0.75rem' }}>
              You can always add more sites later. Skip if single-site.
            </p>

            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'space-between' }}>
              <button style={btnSecondary} onClick={() => setStep(0)}>← Back</button>
              <button style={btnPrimary} onClick={() => setStep(2)}>Continue →</button>
            </div>
          </div>
        )}

        {/* Step 2 — Intensity Metrics */}
        {step === 2 && (
          <div style={card}>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.5rem', marginBottom: '0.4rem', letterSpacing: '-0.02em' }}>
              Intensity metrics
            </h2>
            <p style={{ color: 'var(--text-3)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
              SECR requires at least one intensity ratio. Add your figures to calculate tCO₂e per employee and per £m revenue.
            </p>
            <div style={{ padding: '0.6rem 0.875rem', background: 'var(--amber-light)', border: '1px solid rgba(184,122,0,0.2)', borderRadius: 'var(--radius-xs)', marginBottom: '1.75rem' }}>
              <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.68rem', color: 'var(--amber)' }}>
                ◎ SECR requires intensity ratios — at least employees or revenue
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={label}>Number of employees (FTE)</label>
                <input type="number" min="1" style={input}
                  value={profile.employees || ''}
                  onChange={e => update('employees', parseInt(e.target.value) || undefined)}
                  placeholder="e.g. 250" />
              </div>
              <div>
                <label style={label}>Annual revenue (£m)</label>
                <input type="number" min="0" step="0.1" style={input}
                  value={profile.revenue_m || ''}
                  onChange={e => update('revenue_m', parseFloat(e.target.value) || undefined)}
                  placeholder="e.g. 12.5" />
              </div>
              <div>
                <label style={label}>Total floor area (m²) — optional</label>
                <input type="number" min="0" style={input}
                  value={profile.floor_area_m2 || ''}
                  onChange={e => update('floor_area_m2', parseFloat(e.target.value) || undefined)}
                  placeholder="e.g. 4500" />
              </div>
            </div>
            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'space-between' }}>
              <button style={btnSecondary} onClick={() => setStep(1)}>← Back</button>
              <button style={btnPrimary} onClick={() => setStep(3)}>Continue →</button>
            </div>
          </div>
        )}

        {/* Step 3 — Review */}
        {step === 3 && (
          <div style={card}>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.5rem', marginBottom: '0.4rem', letterSpacing: '-0.02em' }}>
              Ready to calculate
            </h2>
            <p style={{ color: 'var(--text-3)', fontSize: '0.875rem', marginBottom: '1.75rem' }}>
              Your profile is set up. You can update these details at any time.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
              {[
                { label: 'Organisation', value: profile.name },
                { label: 'Sector', value: profile.sector },
                { label: 'Sites', value: profile.sites.filter(Boolean).join(', ') || 'None added' },
                { label: 'Employees', value: profile.employees ? profile.employees.toLocaleString() : '—' },
                { label: 'Revenue', value: profile.revenue_m ? `£${profile.revenue_m}m` : '—' },
                { label: 'Floor area', value: profile.floor_area_m2 ? `${profile.floor_area_m2.toLocaleString()} m²` : '—' },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.72rem', color: 'var(--text-3)', letterSpacing: '0.04em' }}>{row.label.toUpperCase()}</span>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text)' }}>{row.value}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button style={btnSecondary} onClick={() => setStep(2)}>← Back</button>
              <button style={btnPrimary} onClick={finish}>Start calculating →</button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
