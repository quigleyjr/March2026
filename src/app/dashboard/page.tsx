'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { ActivityInput, CalculationResult, OrgProfile } from '@/types'
import { ResultsPanel } from '@/components/calculator/ResultsPanel'
import { InputForm } from '@/components/calculator/InputForm'
import { GapsPanel } from '@/components/calculator/GapsPanel'

const TEST_PROFILES: { label: string; profile: OrgProfile; inputs: { factor_id: string; source_type: string; quantity: number; unit: string; site?: string }[] }[] = [
  {
    label: 'Acme Manufacturing Ltd — Multi-site',
    profile: { name: 'Acme Manufacturing Ltd', sector: 'Manufacturing', employees: 320, revenue_m: 28.5, floor_area_m2: 12000, companies_house: '09876543', sites: ['Sheffield Works', 'Leeds Office', 'Manchester Depot'] },
    inputs: [
      { factor_id: 'natural_gas_kwh', source_type: 'natural_gas_kwh', quantity: 180000, unit: 'kWh', site: 'Sheffield Works' },
      { factor_id: 'natural_gas_kwh', source_type: 'natural_gas_kwh', quantity: 32000,  unit: 'kWh', site: 'Leeds Office' },
      { factor_id: 'electricity_kwh', source_type: 'electricity_kwh', quantity: 420000, unit: 'kWh', site: 'Sheffield Works' },
      { factor_id: 'electricity_kwh', source_type: 'electricity_kwh', quantity: 85000,  unit: 'kWh', site: 'Leeds Office' },
      { factor_id: 'electricity_kwh', source_type: 'electricity_kwh', quantity: 44000,  unit: 'kWh', site: 'Manchester Depot' },
      { factor_id: 'diesel_litres',   source_type: 'diesel_litres',   quantity: 12500,  unit: 'litres', site: 'Manchester Depot' },
      { factor_id: 'flight_short_haul', source_type: 'flight_short_haul', quantity: 8400, unit: 'km' },
    ],
  },
  {
    label: 'Greenleaf Consulting — Professional Services',
    profile: { name: 'Greenleaf Consulting', sector: 'Professional Services', employees: 45, revenue_m: 4.2, floor_area_m2: 850, sites: ['London HQ'] },
    inputs: [
      { factor_id: 'natural_gas_kwh', source_type: 'natural_gas_kwh', quantity: 18000,  unit: 'kWh', site: 'London HQ' },
      { factor_id: 'electricity_kwh', source_type: 'electricity_kwh', quantity: 52000,  unit: 'kWh', site: 'London HQ' },
      { factor_id: 'flight_long_haul', source_type: 'flight_long_haul', quantity: 24000, unit: 'km' },
      { factor_id: 'flight_short_haul', source_type: 'flight_short_haul', quantity: 12000, unit: 'km' },
      { factor_id: 'rail_national',   source_type: 'rail_national',   quantity: 18500,  unit: 'km' },
      { factor_id: 'grey_fleet_petrol', source_type: 'grey_fleet_petrol', quantity: 22000, unit: 'km' },
    ],
  },
  {
    label: 'Swift Logistics — Transport & Fleet',
    profile: { name: 'Swift Logistics Ltd', sector: 'Logistics & Transport', employees: 180, revenue_m: 15.8, floor_area_m2: 6500, sites: ['Birmingham Hub', 'Bristol Depot'] },
    inputs: [
      { factor_id: 'diesel_litres',   source_type: 'diesel_litres',   quantity: 85000,  unit: 'litres', site: 'Birmingham Hub' },
      { factor_id: 'diesel_litres',   source_type: 'diesel_litres',   quantity: 42000,  unit: 'litres', site: 'Bristol Depot' },
      { factor_id: 'natural_gas_kwh', source_type: 'natural_gas_kwh', quantity: 28000,  unit: 'kWh', site: 'Birmingham Hub' },
      { factor_id: 'electricity_kwh', source_type: 'electricity_kwh', quantity: 68000,  unit: 'kWh', site: 'Birmingham Hub' },
      { factor_id: 'electricity_kwh', source_type: 'electricity_kwh', quantity: 31000,  unit: 'kWh', site: 'Bristol Depot' },
    ],
  },
  {
    label: 'Riverstone Retail — Single Site',
    profile: { name: 'Riverstone Retail Ltd', sector: 'Retail', employees: 62, revenue_m: 7.1, floor_area_m2: 2200, sites: ['Bristol Store'] },
    inputs: [
      { factor_id: 'natural_gas_kwh', source_type: 'natural_gas_kwh', quantity: 41000,  unit: 'kWh', site: 'Bristol Store' },
      { factor_id: 'electricity_kwh', source_type: 'electricity_kwh', quantity: 148000, unit: 'kWh', site: 'Bristol Store' },
      { factor_id: 'van_diesel_km',   source_type: 'van_diesel_km',   quantity: 28000,  unit: 'km',  site: 'Bristol Store' },
    ],
  },
  {
    label: 'Northfield Academy — Education',
    profile: { name: 'Northfield Academy', sector: 'Education', employees: 110, revenue_m: 6.8, floor_area_m2: 8500, sites: ['Main Campus'] },
    inputs: [
      { factor_id: 'natural_gas_kwh', source_type: 'natural_gas_kwh', quantity: 295000, unit: 'kWh', site: 'Main Campus' },
      { factor_id: 'electricity_kwh', source_type: 'electricity_kwh', quantity: 210000, unit: 'kWh', site: 'Main Campus' },
      { factor_id: 'petrol_litres',   source_type: 'petrol_litres',   quantity: 3200,   unit: 'litres' },
    ],
  },
]

export default function DashboardPage() {
  const router = useRouter()
  const [result, setResult] = useState<CalculationResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [profile, setProfile] = useState<OrgProfile | null>(null)
  const [formKey, setFormKey] = useState(0)
  const [reuseTemplate, setReuseTemplate] = useState<{
    organisation_name: string
    inputs: { factor_id: string; source_type: string; quantity: number; unit: string; site?: string; estimated?: boolean }[]
  } | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem('org_profile')
    if (saved) setProfile(JSON.parse(saved))

    const template = localStorage.getItem('reuse_template')
    if (template) {
      setReuseTemplate(JSON.parse(template))
      setFormKey(k => k + 1)
      localStorage.removeItem('reuse_template')
    }
  }, [])

  function applyTestProfile(idx: string) {
    if (!idx) return
    const tp = TEST_PROFILES[parseInt(idx)]
    if (!tp) return
    // Save profile to localStorage (same as onboarding)
    localStorage.setItem('org_profile', JSON.stringify(tp.profile))
    setProfile(tp.profile)
    // Set reuse template with the test inputs
    const template = {
      organisation_name: tp.profile.name,
      inputs: tp.inputs.map(inp => ({ ...inp, estimated: false })),
    }
    setReuseTemplate({ ...template })
    setFormKey(k => k + 1)
    setResult(null)
  }

  async function handleCalculate(data: {
    organisation_name: string
    reporting_period_start: string
    reporting_period_end: string
    inputs: ActivityInput[]
  }) {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          save: true,
          intensity: profile ? {
            employees: profile.employees,
            revenue_m: profile.revenue_m,
            floor_area_m2: profile.floor_area_m2,
          } : undefined,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Calculation failed')
      setResult(json.result)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const mono = { fontFamily: 'JetBrains Mono, monospace' }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <nav style={{
        background: 'var(--white)', borderBottom: '1px solid var(--border)',
        padding: '0 2rem', height: 56,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 50, boxShadow: 'var(--shadow-sm)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: 28, height: 28, background: 'var(--green)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 2L9.5 6H4.5L7 2Z" fill="white"/><path d="M2 9.5C2 7.5 4.5 6 7 6C9.5 6 12 7.5 12 9.5C12 11.5 9.5 12 7 12C4.5 12 2 11.5 2 9.5Z" fill="white" opacity="0.6"/></svg>
          </div>
          <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1rem', color: 'var(--text)' }}>
            February<span style={{ color: 'var(--green)' }}>2026</span>
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'var(--green-light)', borderRadius: 20, padding: '0.3rem 0.75rem' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green-mid)' }} />
            <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--green)' }}>Live</span>
          </div>
          <button onClick={() => router.push('/history')}
            style={{ ...mono, fontSize: '0.72rem', color: 'var(--text-3)', background: 'none', border: '1px solid var(--border)', padding: '0.3rem 0.75rem', borderRadius: 'var(--radius-xs)', cursor: 'pointer' }}>
            History
          </button>
          <button onClick={() => router.push('/onboarding')}
            style={{ ...mono, fontSize: '0.72rem', color: 'var(--text-3)', background: 'none', border: '1px solid var(--border)', padding: '0.3rem 0.75rem', borderRadius: 'var(--radius-xs)', cursor: 'pointer' }}>
            {profile ? '⚙ Profile' : '+ Setup'}
          </button>

          {/* Test profiles dropdown */}
          <div style={{ position: 'relative' as const }}>
            <select
              defaultValue=""
              onChange={e => { applyTestProfile(e.target.value); e.target.value = '' }}
              style={{
                ...mono, fontSize: '0.72rem', color: 'var(--green)',
                background: 'var(--green-light)', border: '1px solid var(--border-strong)',
                padding: '0.3rem 0.75rem', borderRadius: 'var(--radius-xs)', cursor: 'pointer',
                outline: 'none', maxWidth: 180,
              }}>
              <option value="" disabled>⚗ Test profile…</option>
              {TEST_PROFILES.map((tp, i) => (
                <option key={i} value={String(i)}>{tp.label}</option>
              ))}
            </select>
          </div>
        </div>
      </nav>

      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem 1.5rem' }}>

        {/* Reuse template banner */}
        {reuseTemplate && (
          <div style={{
            marginBottom: '1.25rem', padding: '0.875rem 1.25rem',
            background: 'var(--blue-light)', border: '1px solid rgba(26,77,140,0.2)',
            borderRadius: 'var(--radius-sm)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <p style={{ fontSize: '0.875rem', color: 'var(--blue)', fontWeight: 500 }}>
              ↺ {reuseTemplate.inputs.length} emission source{reuseTemplate.inputs.length !== 1 ? 's' : ''} loaded from history — update the dates and calculate
            </p>
          </div>
        )}

        {/* Profile banner if no profile */}
        {!profile && (
          <div style={{
            marginBottom: '1.25rem', padding: '0.875rem 1.25rem',
            background: 'var(--amber-light)', border: '1px solid rgba(184,122,0,0.2)',
            borderRadius: 'var(--radius-sm)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <p style={{ fontSize: '0.875rem', color: 'var(--amber)', fontWeight: 500 }}>
              ◎ Set up your organisation profile to enable intensity metrics and site tracking
            </p>
            <button onClick={() => router.push('/onboarding')}
              style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--amber)', background: 'none', border: '1px solid currentColor', padding: '0.3rem 0.75rem', borderRadius: 'var(--radius-xs)', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              Set up →
            </button>
          </div>
        )}

        {/* Profile summary if set */}
        {profile && (
          <div style={{ marginBottom: '1.25rem', padding: '0.75rem 1.25rem', background: 'var(--green-light)', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--green)' }}>{profile.name}</span>
            {profile.sector && <span style={{ ...mono, fontSize: '0.68rem', color: 'var(--text-3)' }}>{profile.sector}</span>}
            {profile.employees && <span style={{ ...mono, fontSize: '0.68rem', color: 'var(--text-3)' }}>{profile.employees.toLocaleString()} employees</span>}
            {profile.revenue_m && <span style={{ ...mono, fontSize: '0.68rem', color: 'var(--text-3)' }}>£{profile.revenue_m}m revenue</span>}
            {profile.sites.filter(Boolean).length > 0 && <span style={{ ...mono, fontSize: '0.68rem', color: 'var(--text-3)' }}>{profile.sites.filter(Boolean).length} sites</span>}
          </div>
        )}

        <div style={{ marginBottom: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.68rem', color: 'var(--green)', letterSpacing: '0.08em', textTransform: 'uppercase', background: 'var(--green-light)', padding: '0.2rem 0.6rem', borderRadius: 20, fontWeight: 500 }}>Scope 1 · 2 · 3</span>
          </div>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.75rem', letterSpacing: '-0.02em', color: 'var(--text)', lineHeight: 1.2 }}>
            Emissions Calculator
          </h1>
          <p style={{ marginTop: '0.4rem', color: 'var(--text-3)', fontSize: '0.875rem' }}>
            DESNZ 2024 factors · GHG Protocol · Full audit trail for SECR disclosure
          </p>
        </div>

        <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: result ? '420px 1fr' : '520px' }}>
          <div>
            <InputForm key={formKey} onCalculate={handleCalculate} loading={loading} profile={profile} reuseTemplate={reuseTemplate} />
            {error && (
              <div style={{ marginTop: '0.75rem', padding: '0.75rem 1rem', background: 'var(--red-light)', color: 'var(--red)', border: '1px solid rgba(184,50,50,0.2)', borderRadius: 'var(--radius-sm)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem' }}>
                {error}
              </div>
            )}
          </div>

          {result && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <ResultsPanel result={result} />
              {result.gaps.length > 0 && <GapsPanel gaps={result.gaps} />}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
