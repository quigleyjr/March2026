'use client'

import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import type { CalculationResult, OrgProfile } from '@/types'


function NarrativeDisplay({ text }: { text: string }) {
  const clean = text
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/^#{1,3}\s+/gm, '')
    .replace(/^-\s+/gm, '')
    .trim()
  const paragraphs = clean.split(/\n{2,}/).map(p => p.replace(/\n/g, ' ').trim()).filter(Boolean)
  return (
    <div>
      {paragraphs.map((para, i) => (
        <p key={i} style={{
          fontSize: '0.925rem',
          lineHeight: 2,
          color: '#1a2218',
          fontWeight: 400,
          margin: i < paragraphs.length - 1 ? '0 0 1.1em 0' : '0',
          textIndent: i === 0 ? 0 : '1.5em',
        }}>
          {para}
        </p>
      ))}
    </div>
  )
}

export function ResultsPanel({ result, profile }: { result: CalculationResult; profile?: OrgProfile | null }) {
  const [narrative,        setNarrative]        = useState('')
  const [narrativeLoading, setNarrativeLoading] = useState(false)
  const [narrativeError,   setNarrativeError]   = useState('')
  const [pdfLoading,       setPdfLoading]       = useState(false)
  const [shareLoading,     setShareLoading]     = useState(false)
  const [shareUrl,         setShareUrl]         = useState('')

  const { summary, lines, intensity } = result
  const userLines = lines.filter((l: { input: { notes?: string } }) => !l.input.notes?.startsWith('Auto WTT'))
  const wttLines  = lines.filter((l: { input: { notes?: string } }) =>  l.input.notes?.startsWith('Auto WTT'))

  const chartData = [
    { name: 'Scope 1', value: summary.scope_1_t_co2e, color: 'var(--green)' },
    { name: 'Scope 2', value: summary.scope_2_t_co2e, color: 'var(--blue)'  },
    { name: 'Scope 3', value: summary.scope_3_t_co2e, color: 'var(--amber)' },
  ].filter(d => d.value > 0)

  async function generateNarrative() {
    setNarrativeLoading(true); setNarrativeError('')
    try {
      const res = await fetch('/api/narrative', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ result }) })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed')
      setNarrative(json.narrative)
    } catch (e) { setNarrativeError(e instanceof Error ? e.message : 'Failed') }
    finally { setNarrativeLoading(false) }
  }

  async function downloadPdf() {
    setPdfLoading(true)
    try {
      const res = await fetch('/api/pdf', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ result, narrative, brand: profile?.brand }) })
      if (!res.ok) throw new Error('Report generation failed')
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href = url
      a.download = `${result.organisation_name.replace(/\s+/g, '-')}-SECR-${result.reporting_period_start}.html`
      document.body.appendChild(a); a.click(); document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (e) { alert(e instanceof Error ? e.message : 'Failed') }
    finally { setPdfLoading(false) }
  }

  async function printReport() {
    try {
      const res = await fetch('/api/pdf', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ result, narrative, brand: profile?.brand }) })
      if (!res.ok) throw new Error('Report generation failed')
      const html = await res.text()
      const win = window.open('', '_blank')
      if (!win) return
      win.document.open(); win.document.write(html); win.document.close()
      win.addEventListener('load', () => win.print())
    } catch (e) { alert(e instanceof Error ? e.message : 'Failed') }
  }

  async function shareResult() {
    setShareLoading(true)
    try {
      const res = await fetch('/api/share', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ calculation_id: result.id }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      const url = `${window.location.origin}${data.url}`
      setShareUrl(url)
      await navigator.clipboard.writeText(url)
    } catch (e) { alert(e instanceof Error ? e.message : 'Share failed') }
    finally { setShareLoading(false) }
  }

  const mono: React.CSSProperties  = { fontFamily: 'JetBrains Mono, monospace' }
  const sHead: React.CSSProperties = { fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-3)', letterSpacing: '0.06em', textTransform: 'uppercase' as const, marginBottom: '0.875rem' }
  const card:  React.CSSProperties = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1.25rem', boxShadow: 'var(--shadow-sm)' }
  const pct = (v: number) => summary.total_t_co2e > 0 ? `${(v / summary.total_t_co2e * 100).toFixed(0)}%` : '0%'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

      {/* Provisional warning */}
      {result.metadata?.factor_version_provisional && (
        <div style={{ padding: '0.75rem 1rem', background: 'var(--amber-light)', border: '1px solid #e8c97a', borderRadius: 'var(--radius-sm)', display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
          <span>&#9888;</span>
          <div>
            <p style={{ fontWeight: 700, color: 'var(--amber)', fontSize: '0.8rem' }}>DESNZ 2025 provisional factors in use</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--amber)', marginTop: '0.2rem' }}>
              Official DESNZ 2025 values are due June 2026. Do not use for final statutory SECR disclosure until then.
            </p>
          </div>
        </div>
      )}

      {/* Hero */}
      <div style={{ background: '#141a12', borderRadius: 'var(--radius)', padding: '1.5rem', color: '#fff' }}>
        <p style={{ ...mono, fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Total Emissions</p>
        <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '3rem', fontWeight: 800, color: '#4ca66a', lineHeight: 1 }}>{summary.total_t_co2e.toFixed(2)}</div>
        <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.4rem' }}>tCO2e &middot; {result.reporting_period_start} to {result.reporting_period_end}</p>
        <p style={{ ...mono, fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', marginTop: '0.5rem' }}>{result.organisation_name} &middot; &plusmn;{summary.uncertainty_pct}% uncertainty</p>
        <div style={{ display: 'flex', height: 6, borderRadius: 3, overflow: 'hidden', marginTop: '1rem', gap: 0 }}>
          <div style={{ width: pct(summary.scope_1_t_co2e), background: 'var(--green)' }} />
          <div style={{ width: pct(summary.scope_2_t_co2e), background: 'var(--blue)' }} />
          <div style={{ width: pct(summary.scope_3_t_co2e), background: 'var(--amber)' }} />
        </div>
      </div>

      {/* Scope cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
        {[
          { label: 'Scope 1', val: summary.scope_1_t_co2e, color: 'var(--green)', bg: 'var(--green-light)', sub: 'Direct combustion' },
          { label: 'Scope 2', val: summary.scope_2_t_co2e, color: 'var(--blue)',  bg: 'var(--blue-light)',  sub: 'Purchased electricity' },
          { label: 'Scope 3', val: summary.scope_3_t_co2e, color: 'var(--amber)', bg: 'var(--amber-light)', sub: 'Indirect & travel' },
        ].map(s => (
          <div key={s.label} style={{ background: s.bg, border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1rem', boxShadow: 'var(--shadow-sm)' }}>
            <p style={{ fontSize: '0.68rem', fontWeight: 700, color: s.color, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.35rem' }}>{s.label}</p>
            <p style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.4rem', fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.val.toFixed(2)}</p>
            <p style={{ ...mono, fontSize: '0.62rem', color: s.color, opacity: 0.7, marginTop: '0.25rem' }}>{s.sub} &middot; {pct(s.val)}</p>
          </div>
        ))}
      </div>

      {/* Bar chart */}
      {chartData.length > 0 && (
        <div style={card}>
          <p style={sHead}>Scope breakdown</p>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={chartData} barSize={40}>
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip formatter={(v: number) => [`${v.toFixed(4)} tCO2e`, '']} contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid var(--border)' }} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Site breakdown */}
      {summary.sites && summary.sites.length > 1 && (
        <div style={card}>
          <p style={sHead}>Site breakdown</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {summary.sites.map((site: { site: string; t_co2e: number; scope_1: number; scope_2: number; scope_3: number }) => {
              const sp = summary.total_t_co2e > 0 ? (site.t_co2e / summary.total_t_co2e) * 100 : 0
              return (
                <div key={site.site}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{site.site}</span>
                    <span style={{ ...mono, fontSize: '0.72rem', color: 'var(--green)', fontWeight: 700 }}>{site.t_co2e.toFixed(2)}t</span>
                  </div>
                  <div style={{ height: 5, background: 'var(--bg)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${sp}%`, height: '100%', background: 'var(--green)' }} />
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.2rem' }}>
                    <span style={{ ...mono, fontSize: '0.6rem', color: 'var(--green)' }}>S1 {site.scope_1.toFixed(2)}t</span>
                    <span style={{ ...mono, fontSize: '0.6rem', color: 'var(--blue)' }}>S2 {site.scope_2.toFixed(2)}t</span>
                    <span style={{ ...mono, fontSize: '0.6rem', color: 'var(--amber)' }}>S3 {site.scope_3.toFixed(2)}t</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Intensity */}
      {intensity && (intensity.per_employee || intensity.per_revenue_m || intensity.per_floor_area) && (
        <div style={card}>
          <p style={sHead}>Intensity metrics</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.5rem' }}>
            {intensity.per_employee   && <div style={{ background: 'var(--bg)', borderRadius: 'var(--radius-sm)', padding: '0.75rem', textAlign: 'center' }}><p style={{ ...mono, fontSize: '1.1rem', fontWeight: 700, color: 'var(--green)' }}>{intensity.per_employee.toFixed(3)}</p><p style={{ fontSize: '0.68rem', color: 'var(--text-3)', marginTop: '0.2rem' }}>tCO2e / employee</p></div>}
            {intensity.per_revenue_m  && <div style={{ background: 'var(--bg)', borderRadius: 'var(--radius-sm)', padding: '0.75rem', textAlign: 'center' }}><p style={{ ...mono, fontSize: '1.1rem', fontWeight: 700, color: 'var(--blue)' }}>{intensity.per_revenue_m.toFixed(3)}</p><p style={{ fontSize: '0.68rem', color: 'var(--text-3)', marginTop: '0.2rem' }}>tCO2e / Lm revenue</p></div>}
            {intensity.per_floor_area && <div style={{ background: 'var(--bg)', borderRadius: 'var(--radius-sm)', padding: '0.75rem', textAlign: 'center' }}><p style={{ ...mono, fontSize: '1.1rem', fontWeight: 700, color: 'var(--amber)' }}>{intensity.per_floor_area.toFixed(4)}</p><p style={{ fontSize: '0.68rem', color: 'var(--text-3)', marginTop: '0.2rem' }}>tCO2e / m2</p></div>}
          </div>
        </div>
      )}

      {/* Quality + Export */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
        <div style={{ ...card, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <p style={sHead}>Data Quality</p>
          <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '2rem', fontWeight: 800, color: summary.data_quality_score >= 80 ? 'var(--green)' : summary.data_quality_score >= 60 ? 'var(--amber)' : 'var(--red)' }}>{summary.data_quality_score}</div>
          <p style={{ ...mono, fontSize: '0.65rem', color: 'var(--text-3)' }}>/100 &middot; &plusmn;{summary.uncertainty_pct}% uncertainty</p>
          {summary.estimated_lines > 0 && <p style={{ ...mono, fontSize: '0.65rem', color: 'var(--amber)' }}>{summary.estimated_lines} estimated line{summary.estimated_lines > 1 ? 's' : ''}</p>}
        </div>

        <div style={{ ...card, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <p style={sHead}>Export</p>
          <button onClick={downloadPdf} disabled={pdfLoading} style={{ padding: '0.5rem', fontSize: '0.78rem', fontWeight: 700, background: pdfLoading ? 'var(--border-strong)' : 'var(--green)', color: pdfLoading ? 'var(--text-3)' : 'white', border: 'none', borderRadius: 'var(--radius-xs)', cursor: pdfLoading ? 'wait' : 'pointer' }}>
            {pdfLoading ? 'Generating...' : 'Download Report'}
          </button>
          <button onClick={printReport} style={{ padding: '0.4rem', fontSize: '0.72rem', fontWeight: 600, background: 'var(--bg)', color: 'var(--text-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xs)', cursor: 'pointer' }}>
            Print / Save as PDF
          </button>
          <button onClick={shareResult} disabled={shareLoading} style={{ padding: '0.4rem', fontSize: '0.72rem', fontWeight: 600, background: shareUrl ? 'var(--blue-light)' : 'var(--bg)', color: shareUrl ? 'var(--blue)' : 'var(--text-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xs)', cursor: shareLoading ? 'wait' : 'pointer' }}>
            {shareLoading ? 'Generating link...' : shareUrl ? 'Link copied!' : 'Share report'}
          </button>
          {shareUrl && <p style={{ ...mono, fontSize: '0.6rem', color: 'var(--text-3)', wordBreak: 'break-all', lineHeight: 1.4 }}>{shareUrl}</p>}
          {profile?.brand?.name && <p style={{ ...mono, fontSize: '0.6rem', color: 'var(--green)' }}>Brand: {profile.brand.name}</p>}
        </div>
      </div>

      {/* SECR narrative */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
        {/* Document header bar */}
        <div style={{ padding: '0.875rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f9faf8' }}>
          <div>
            <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '0.85rem', color: 'var(--text)', letterSpacing: '0.01em', margin: 0 }}>SECR Narrative</p>
            <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6rem', color: 'var(--text-3)', margin: '2px 0 0 0', letterSpacing: '0.04em' }}>Directors&apos; Report — Energy &amp; Carbon Disclosure</p>
          </div>
          <button
            onClick={generateNarrative}
            disabled={narrativeLoading}
            style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.67rem', fontWeight: 600, color: narrativeLoading ? 'var(--text-3)' : 'var(--green)', background: narrativeLoading ? 'var(--bg)' : 'var(--green-light)', border: '1px solid var(--border-strong)', padding: '0.35rem 0.875rem', borderRadius: 'var(--radius-xs)', cursor: narrativeLoading ? 'wait' : 'pointer', transition: 'opacity 0.15s' }}
          >
            {narrativeLoading ? '↻  Writing…' : narrative ? '↻  Regenerate' : '✦  Generate with AI'}
          </button>
        </div>

        {/* Document body */}
        <div style={{ padding: '2rem 2.25rem 2rem' }}>
          {narrativeError && (
            <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.72rem', color: 'var(--red)', marginBottom: '1rem' }}>{narrativeError}</p>
          )}
          {narrative ? (
            <NarrativeDisplay text={narrative} />
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
              <p style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>✦</p>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-3)', lineHeight: 1.6 }}>
                Generate a statutory SECR narrative ready to paste into your<br />Directors&apos; Report or annual report filing.
              </p>
            </div>
          )}
        </div>

        {/* Document footer */}
        {narrative && (
          <div style={{ padding: '0.75rem 1.5rem', borderTop: '1px solid var(--border)', background: '#f9faf8', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6rem', color: 'var(--text-3)' }}>
              DESNZ GHG Conversion Factors {result.factor_version} · GHG Protocol · Operational Control
            </span>
            <button
              onClick={async () => { await navigator.clipboard.writeText(narrative) }}
              style={{ marginLeft: 'auto', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6rem', color: 'var(--text-3)', background: 'none', border: '1px solid var(--border)', padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-xs)', cursor: 'pointer' }}
            >
              Copy text
            </button>
          </div>
        )}
      </div>

      {/* Audit trail */}
      <div style={card}>
        <p style={sHead}>Emission lines ({userLines.length} sources{wttLines.length > 0 ? ` + ${wttLines.length} WTT` : ''})</p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg)' }}>
                {['Source', 'Sc', 'Qty', 'Unit', 'Factor', 'kg CO2e', 'tCO2e'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '0.4rem 0.5rem', color: 'var(--text-3)', fontWeight: 600, fontSize: '0.65rem', letterSpacing: '0.05em', textTransform: 'uppercase', borderBottom: '1px solid var(--border)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {userLines.map((l, i) => {
                const sc = l.scope as 1 | 2 | 3
                const scopeColour = ({ 1: 'var(--green)', 2: 'var(--blue)', 3: 'var(--amber)' } as Record<number, string>)[sc]
                const scopeBg     = ({ 1: 'var(--green-light)', 2: 'var(--blue-light)', 3: 'var(--amber-light)' } as Record<number, string>)[sc]
                return (
                  <tr key={i} style={{ borderBottom: '1px solid var(--bg)' }}>
                    <td style={{ padding: '0.4rem 0.5rem', fontWeight: 500 }}>{l.factor.label}{l.input.estimated && <span style={{ ...mono, fontSize: '0.55rem', color: 'var(--amber)', marginLeft: 4 }}>est</span>}</td>
                    <td style={{ padding: '0.4rem 0.5rem' }}><span style={{ fontSize: '0.6rem', fontWeight: 700, padding: '1px 5px', borderRadius: 9, background: scopeBg, color: scopeColour }}>S{sc}</span></td>
                    <td style={{ ...mono, padding: '0.4rem 0.5rem', textAlign: 'right' }}>{l.input.quantity.toLocaleString()}</td>
                    <td style={{ padding: '0.4rem 0.5rem', color: 'var(--text-3)' }}>{l.input.unit}</td>
                    <td style={{ ...mono, padding: '0.4rem 0.5rem', textAlign: 'right', color: 'var(--text-3)' }}>{l.factor.kg_co2e_per_unit}</td>
                    <td style={{ ...mono, padding: '0.4rem 0.5rem', textAlign: 'right' }}>{l.kg_co2e.toFixed(3)}</td>
                    <td style={{ ...mono, padding: '0.4rem 0.5rem', textAlign: 'right', fontWeight: 700, color: scopeColour }}>{l.t_co2e.toFixed(4)}</td>
                  </tr>
                )
              })}
              {wttLines.map((l, i) => (
                <tr key={`wtt_${i}`} style={{ borderBottom: '1px solid var(--bg)', opacity: 0.55 }}>
                  <td style={{ padding: '0.4rem 0.5rem', color: 'var(--text-3)', fontStyle: 'italic' }}>{l.factor.label}</td>
                  <td style={{ padding: '0.4rem 0.5rem' }}><span style={{ fontSize: '0.6rem', fontWeight: 700, padding: '1px 5px', borderRadius: 9, background: 'var(--amber-light)', color: 'var(--amber)' }}>S3</span></td>
                  <td style={{ ...mono, padding: '0.4rem 0.5rem', textAlign: 'right', color: 'var(--text-3)' }}>{l.input.quantity.toLocaleString()}</td>
                  <td style={{ padding: '0.4rem 0.5rem', color: 'var(--text-3)' }}>{l.input.unit}</td>
                  <td style={{ ...mono, padding: '0.4rem 0.5rem', textAlign: 'right', color: 'var(--text-3)' }}>{l.factor.kg_co2e_per_unit}</td>
                  <td style={{ ...mono, padding: '0.4rem 0.5rem', textAlign: 'right', color: 'var(--text-3)' }}>{l.kg_co2e.toFixed(3)}</td>
                  <td style={{ ...mono, padding: '0.4rem 0.5rem', textAlign: 'right', color: 'var(--text-3)' }}>{l.t_co2e.toFixed(4)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}
