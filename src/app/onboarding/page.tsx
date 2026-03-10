'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { OrgProfile } from '@/types'

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [profile, setProfile] = useState<OrgProfile & { brand?: { name?: string; colour?: string; footer?: string } }>({ name: '', sites: [''] })

  function updateProfile(field: keyof OrgProfile, value: unknown) {
    setProfile(p => ({ ...p, [field]: value }))
  }

  function addSite() { setProfile(p => ({ ...p, sites: [...p.sites, ''] })) }
  function removeSite(i: number) { setProfile(p => ({ ...p, sites: p.sites.filter((_, idx) => idx !== i) })) }
  function updateSite(i: number, val: string) {
    setProfile(p => { const sites = [...p.sites]; sites[i] = val; return { ...p, sites } })
  }

  function save() {
    localStorage.setItem('org_profile', JSON.stringify({ ...profile, sites: profile.sites.filter(Boolean) }))
    router.push('/dashboard')
  }

  const inp:  React.CSSProperties = { width: '100%', padding: '0.5rem 0.75rem', fontSize: '0.875rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-xs)', background: 'var(--bg)', color: 'var(--text)', outline: 'none', fontFamily: 'inherit' }
  const lbl:  React.CSSProperties = { display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-2)', marginBottom: '0.35rem' }
  const card: React.CSSProperties = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1.5rem', boxShadow: 'var(--shadow-sm)', marginBottom: '1rem' }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <nav style={{ background: 'var(--white)', borderBottom: '1px solid var(--border)', padding: '0 2rem', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50, boxShadow: 'var(--shadow-sm)' }}>
        <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1rem', color: 'var(--text)' }}>
          March<span style={{ color: 'var(--green)' }}>0603</span>
        </span>
        <button onClick={() => router.push('/dashboard')} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.72rem', color: 'var(--text-3)', background: 'none', border: '1px solid var(--border)', padding: '0.3rem 0.75rem', borderRadius: 'var(--radius-xs)', cursor: 'pointer' }}>← Skip</button>
      </nav>

      <main style={{ maxWidth: 560, margin: '0 auto', padding: '2.5rem 1.5rem' }}>
        {/* Progress */}
        <div style={{ display: 'flex', gap: '0.375rem', marginBottom: '2rem' }}>
          {[1,2,3,4].map(s => (
            <div key={s} style={{ flex: 1, height: 4, borderRadius: 2, background: s <= step ? 'var(--green)' : 'var(--border)' }} />
          ))}
        </div>

        {step === 1 && (
          <>
            <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.5rem', color: 'var(--text)', marginBottom: '0.4rem' }}>Organisation</h1>
            <p style={{ color: 'var(--text-3)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>Basic details about your company</p>
            <div style={card}>
              <div style={{ marginBottom: '0.875rem' }}>
                <label style={lbl}>Company name *</label>
                <input style={inp} value={profile.name} onChange={e => updateProfile('name', e.target.value)} placeholder="Acme Ltd" required />
              </div>
              <div style={{ marginBottom: '0.875rem' }}>
                <label style={lbl}>Companies House number</label>
                <input style={inp} value={profile.companies_house || ''} onChange={e => updateProfile('companies_house', e.target.value)} placeholder="12345678" />
              </div>
              <div>
                <label style={lbl}>Sector</label>
                <select style={{ ...inp, background: 'var(--surface)' }} value={profile.sector || ''} onChange={e => updateProfile('sector', e.target.value)}>
                  <option value="">Select sector…</option>
                  {['Manufacturing','Retail','Professional Services','Logistics & Transport','Education','Healthcare','Construction','Technology','Finance','Other'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.5rem', color: 'var(--text)', marginBottom: '0.4rem' }}>Sites</h1>
            <p style={{ color: 'var(--text-3)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>Add your operating locations for site-level reporting</p>
            <div style={card}>
              {profile.sites.map((site, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <input style={{ ...inp, flex: 1 }} value={site} onChange={e => updateSite(i, e.target.value)} placeholder={`Site ${i + 1} name`} />
                  {profile.sites.length > 1 && (
                    <button type="button" onClick={() => removeSite(i)} style={{ width: 32, height: 36, background: 'none', border: '1px solid var(--border)', borderRadius: 'var(--radius-xs)', cursor: 'pointer', color: 'var(--text-3)' }}>✕</button>
                  )}
                </div>
              ))}
              <button type="button" onClick={addSite} style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--green)', background: 'var(--green-light)', border: '1px dashed var(--border-strong)', padding: '0.4rem 1rem', borderRadius: 'var(--radius-xs)', cursor: 'pointer', width: '100%', marginTop: '0.25rem' }}>
                + Add site
              </button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.5rem', color: 'var(--text)', marginBottom: '0.4rem' }}>Intensity Metrics</h1>
            <p style={{ color: 'var(--text-3)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>Required for SECR intensity ratios</p>
            <div style={card}>
              <div style={{ marginBottom: '0.875rem' }}>
                <label style={lbl}>Number of employees</label>
                <input style={inp} type="number" min="1" value={profile.employees || ''} onChange={e => updateProfile('employees', parseInt(e.target.value) || undefined)} placeholder="e.g. 250" />
              </div>
              <div style={{ marginBottom: '0.875rem' }}>
                <label style={lbl}>Annual revenue (£m)</label>
                <input style={inp} type="number" min="0" step="0.1" value={profile.revenue_m || ''} onChange={e => updateProfile('revenue_m', parseFloat(e.target.value) || undefined)} placeholder="e.g. 12.5" />
              </div>
              <div>
                <label style={lbl}>Total floor area (m²)</label>
                <input style={inp} type="number" min="0" value={profile.floor_area_m2 || ''} onChange={e => updateProfile('floor_area_m2', parseInt(e.target.value) || undefined)} placeholder="e.g. 5000" />
              </div>
            </div>
          </>
        )}


        {step === 4 && (
          <>
            <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.5rem', color: 'var(--text)', marginBottom: '0.4rem' }}>White-Label Branding</h1>
            <p style={{ color: 'var(--text-3)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>Customise how your reports look — optional</p>
            <div style={card}>
              <div style={{ marginBottom: '0.875rem' }}>
                <label style={lbl}>Report brand name</label>
                <input style={inp} type="text" value={profile.brand?.name || ''} onChange={e => setProfile(p => ({ ...p, brand: { ...p.brand, name: e.target.value } }))} placeholder="e.g. Acme ESG Advisory" />
                <p style={{ fontSize: '0.72rem', color: 'var(--text-3)', marginTop: '0.3rem' }}>Replaces "FreshESG" on downloaded reports</p>
              </div>
              <div style={{ marginBottom: '0.875rem' }}>
                <label style={lbl}>Brand colour (hex)</label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input style={{ ...inp, flex: 1 }} type="text" value={profile.brand?.colour || ''} onChange={e => setProfile(p => ({ ...p, brand: { ...p.brand, colour: e.target.value } }))} placeholder="#1a7a3c" />
                  <input type="color" value={profile.brand?.colour || '#1a7a3c'} onChange={e => setProfile(p => ({ ...p, brand: { ...p.brand, colour: e.target.value } }))} style={{ width: 40, height: 36, border: '1px solid var(--border)', borderRadius: 'var(--radius-xs)', cursor: 'pointer', padding: 2, background: 'var(--surface)' }} />
                </div>
              </div>
              <div>
                <label style={lbl}>Custom footer text</label>
                <input style={inp} type="text" value={profile.brand?.footer || ''} onChange={e => setProfile(p => ({ ...p, brand: { ...p.brand, footer: e.target.value } }))} placeholder="Prepared by Acme ESG Advisory Ltd" />
              </div>
            </div>
          </>
        )}

        {step === 5 && (
          <>
            <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.5rem', color: 'var(--text)', marginBottom: '0.4rem' }}>Review</h1>
            <p style={{ color: 'var(--text-3)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>Confirm your organisation profile</p>
            <div style={card}>
              {[
                ['Company', profile.name],
                ['Companies House', profile.companies_house || '—'],
                ['Sector', profile.sector || '—'],
                ['Employees', profile.employees?.toLocaleString() || '—'],
                ['Revenue', profile.revenue_m ? `£${profile.revenue_m}m` : '—'],
                ['Floor area', profile.floor_area_m2 ? `${profile.floor_area_m2.toLocaleString()} m²` : '—'],
                ['Sites', profile.sites.filter(Boolean).join(', ') || '—'],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-2)', fontWeight: 600 }}>{k}</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text)', fontFamily: k === 'Company' ? 'inherit' : 'JetBrains Mono, monospace' }}>{v}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Navigation */}
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'space-between' }}>
          {step > 1
            ? <button onClick={() => setStep(s => s - 1)} style={{ padding: '0.6rem 1.25rem', fontSize: '0.875rem', fontWeight: 600, background: 'none', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', color: 'var(--text-2)' }}>← Back</button>
            : <div />
          }
          {step < 5
            ? <button onClick={() => setStep(s => s + 1)} disabled={step === 1 && !profile.name.trim()} style={{ padding: '0.6rem 1.5rem', fontSize: '0.875rem', fontWeight: 700, background: 'var(--green)', color: 'white', border: 'none', borderRadius: 'var(--radius-sm)', cursor: profile.name.trim() || step > 1 ? 'pointer' : 'not-allowed', opacity: step === 1 && !profile.name.trim() ? 0.5 : 1 }}>Continue →</button>
            : <button onClick={save} style={{ padding: '0.6rem 1.5rem', fontSize: '0.875rem', fontWeight: 700, background: 'var(--green)', color: 'white', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}>Save & start →</button>
          }
        </div>
      </main>
    </div>
  )
}
