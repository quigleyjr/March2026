'use client'

import { useState } from 'react'
import type { CalculationResult } from '@/types'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface Props { result: CalculationResult }

const SCOPE_COLOURS = ['#2d5a27', '#1e4d8c', '#7a5c00']

export function ResultsPanel({ result }: Props) {
  const { summary, lines, factor_version, organisation_name, reporting_period_start, reporting_period_end, id } = result
  const [narrative, setNarrative] = useState('')
  const [narrativeLoading, setNarrativeLoading] = useState(false)
  const [narrativeError, setNarrativeError] = useState('')

  const chartData = [
    { name: 'Scope 1', value: summary.scope_1_t_co2e, colour: SCOPE_COLOURS[0] },
    { name: 'Scope 2', value: summary.scope_2_t_co2e, colour: SCOPE_COLOURS[1] },
    { name: 'Scope 3', value: summary.scope_3_t_co2e, colour: SCOPE_COLOURS[2] },
  ].filter((d) => d.value > 0)

  const qualityColour = summary.data_quality_score >= 80 ? '#2d5a27' : summary.data_quality_score >= 50 ? '#d4a843' : '#c45c2a'

  async function generateNarrative() {
    setNarrativeLoading(true)
    setNarrativeError('')
    try {
      const res = await fetch('/api/narrative', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ result }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setNarrative(data.narrative)
    } catch (e) {
      setNarrativeError(e instanceof Error ? e.message : 'Failed to generate narrative')
    } finally {
      setNarrativeLoading(false)
    }
  }

  function exportPDF() {
    const wttLines = lines.filter(l => l.input.notes?.startsWith('Auto WTT'))
    const userLines = lines.filter(l => !l.input.notes?.startsWith('Auto WTT'))

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>SECR Report — ${organisation_name}</title>
<style>
  body { font-family: Georgia, serif; max-width: 750px; margin: 40px auto; color: #0e1a12; line-height: 1.6; }
  h1 { font-size: 1.8rem; margin-bottom: 0.25rem; }
  .meta { font-family: monospace; font-size: 0.8rem; opacity: 0.5; margin-bottom: 2rem; }
  .total { background: #0e1a12; color: #c8ddb8; padding: 1.5rem; border-radius: 4px; margin-bottom: 1.5rem; }
  .total h2 { margin: 0 0 0.25rem; font-size: 0.8rem; letter-spacing: 0.1em; text-transform: uppercase; opacity: 0.6; }
  .total .num { font-size: 3rem; font-weight: bold; line-height: 1; }
  .scopes { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem; }
  .scope { border: 1px solid #ccc; padding: 1rem; text-align: center; }
  .scope h3 { margin: 0 0 0.5rem; font-size: 0.75rem; font-family: monospace; letter-spacing: 0.08em; }
  .scope .val { font-size: 1.5rem; font-weight: bold; }
  table { width: 100%; border-collapse: collapse; font-size: 0.85rem; margin-bottom: 1.5rem; }
  th { text-align: left; padding: 0.5rem; background: #e8ede4; font-family: monospace; font-size: 0.7rem; letter-spacing: 0.06em; text-transform: uppercase; }
  td { padding: 0.5rem; border-bottom: 1px solid #eee; }
  .formula { font-family: monospace; font-size: 0.7rem; opacity: 0.5; }
  .narrative { background: #f8f5ee; border-left: 3px solid #2d5a27; padding: 1rem 1.5rem; margin-bottom: 1.5rem; }
  .narrative h2 { font-size: 0.85rem; font-family: monospace; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 0.75rem; color: #2d5a27; }
  .footer { font-family: monospace; font-size: 0.65rem; opacity: 0.4; border-top: 1px solid #eee; padding-top: 1rem; }
  @media print { body { margin: 20px; } }
</style>
</head>
<body>
<h1>${organisation_name}</h1>
<p class="meta">SECR Emissions Report · ${reporting_period_start} to ${reporting_period_end} · Generated ${new Date().toLocaleDateString('en-GB')}</p>

<div class="total">
  <h2>Total Emissions</h2>
  <div class="num">${summary.total_t_co2e.toLocaleString('en-GB', { maximumFractionDigits: 2 })} tCO₂e</div>
  <div style="font-family:monospace;font-size:0.75rem;opacity:0.5;margin-top:0.5rem">±${summary.uncertainty_pct}% uncertainty · DESNZ ${factor_version}</div>
</div>

<div class="scopes">
  <div class="scope"><h3>Scope 1</h3><div class="val">${summary.scope_1_t_co2e}</div><div style="font-size:0.75rem;opacity:0.5">tCO₂e</div></div>
  <div class="scope"><h3>Scope 2</h3><div class="val">${summary.scope_2_t_co2e}</div><div style="font-size:0.75rem;opacity:0.5">tCO₂e</div></div>
  <div class="scope"><h3>Scope 3</h3><div class="val">${summary.scope_3_t_co2e}</div><div style="font-size:0.75rem;opacity:0.5">tCO₂e</div></div>
</div>

${narrative ? `<div class="narrative"><h2>SECR Narrative</h2><p>${narrative}</p></div>` : ''}

<h2 style="font-family:monospace;font-size:0.8rem;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:1rem">Audit Trail</h2>
<table>
<thead><tr><th>Source</th><th>Quantity</th><th>Factor</th><th>tCO₂e</th><th>Scope</th></tr></thead>
<tbody>
${userLines.map(l => `<tr>
  <td>${l.factor.label}</td>
  <td>${l.input.quantity.toLocaleString()} ${l.input.unit}</td>
  <td class="formula">${l.audit.kg_co2e_per_unit} kg CO₂e/${l.input.unit}</td>
  <td><strong>${l.t_co2e.toFixed(4)}</strong></td>
  <td>${l.scope}</td>
</tr>
<tr><td colspan="5" class="formula" style="padding-top:0">${l.audit.formula} · ${l.audit.source_table} · ${l.audit.source_row} · v${l.factor_version}</td></tr>`).join('')}
</tbody>
</table>

<h2 style="font-family:monospace;font-size:0.8rem;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:1rem">Well-to-Tank (Scope 3)</h2>
<table>
<thead><tr><th>Source</th><th>Quantity</th><th>tCO₂e</th></tr></thead>
<tbody>
${wttLines.map(l => `<tr><td>${l.factor.label}</td><td>${l.input.quantity.toLocaleString()} ${l.input.unit}</td><td>${l.t_co2e.toFixed(4)}</td></tr>`).join('')}
</tbody>
</table>

<div class="footer">
  Calculation ID: ${id} · Methodology: GHG Protocol Corporate Standard · Factors: DESNZ ${factor_version} · Consolidation: Operational Control · Scope 2 Method: Location-Based · Data Quality: ${summary.data_quality_score}/100
</div>
</body>
</html>`

    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${organisation_name.replace(/\s+/g, '-')}-SECR-${reporting_period_start}.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  const boxStyle = { background: 'white', border: '1px solid rgba(45,90,39,0.15)', borderRadius: 4, overflow: 'hidden' }
  const monoSm = { fontFamily: 'DM Mono, monospace', fontSize: '0.7rem', letterSpacing: '0.08em' }
  const btnStyle = (primary: boolean) => ({
    padding: '0.6rem 1.2rem', fontSize: '0.85rem', fontWeight: 500,
    background: primary ? '#2d5a27' : 'white',
    color: primary ? '#f4f0e8' : '#2d5a27',
    border: `1px solid ${primary ? '#2d5a27' : '#7aad6e'}`,
    borderRadius: 3, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
  })

  const userLines = lines.filter(l => !l.input.notes?.startsWith('Auto WTT'))
  const wttLines = lines.filter(l => l.input.notes?.startsWith('Auto WTT'))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

      {/* Total */}
      <div style={{ background: '#0e1a12', borderRadius: 4, padding: '1.5rem' }}>
        <p style={{ ...monoSm, color: '#7aad6e', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Total Emissions</p>
        <p style={{ fontFamily: 'Playfair Display, serif', fontSize: '3rem', fontWeight: 900, color: '#c8ddb8', letterSpacing: '-0.03em', lineHeight: 1 }}>
          {summary.total_t_co2e.toLocaleString('en-GB', { maximumFractionDigits: 2 })}
          <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '1rem', fontWeight: 300, color: '#7aad6e', marginLeft: '0.5rem' }}>tCO₂e</span>
        </p>
        <p style={{ ...monoSm, color: 'rgba(200,221,184,0.45)', marginTop: '0.5rem' }}>
          ±{summary.uncertainty_pct}% uncertainty · DESNZ {factor_version}
        </p>
        <div style={{ borderTop: '1px solid rgba(200,221,184,0.1)', marginTop: '0.75rem', paddingTop: '0.75rem' }}>
          <p style={{ ...monoSm, color: 'rgba(200,221,184,0.4)' }}>{organisation_name} · {reporting_period_start} → {reporting_period_end}</p>
          <p style={{ ...monoSm, color: 'rgba(200,221,184,0.25)', marginTop: '0.2rem', fontSize: '0.62rem' }}>ID: {id}</p>
        </div>
      </div>

      {/* Scope breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
        {[1, 2, 3].map((s, i) => {
          const val = [summary.scope_1_t_co2e, summary.scope_2_t_co2e, summary.scope_3_t_co2e][i]
          const pct = summary.total_t_co2e > 0 ? (val / summary.total_t_co2e * 100).toFixed(1) : '0'
          return (
            <div key={s} style={{ ...boxStyle, padding: '1rem', textAlign: 'center' }}>
              <p style={{ ...monoSm, color: SCOPE_COLOURS[i], textTransform: 'uppercase', marginBottom: '0.25rem' }}>Scope {s}</p>
              <p style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: '1.25rem', color: '#0e1a12' }}>
                {val.toLocaleString('en-GB', { maximumFractionDigits: 2 })}
              </p>
              <p style={{ ...monoSm, color: '#0e1a12', opacity: 0.4, fontSize: '0.65rem' }}>{pct}%</p>
            </div>
          )
        })}
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <div style={{ ...boxStyle, padding: '1rem' }}>
          <p style={{ ...monoSm, color: '#5a7a54', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Breakdown</p>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 10, fontFamily: 'DM Mono', fill: '#5a7a54' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fontFamily: 'DM Mono', fill: '#5a7a54' }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v: number) => [`${v.toFixed(4)} tCO₂e`, '']}
                contentStyle={{ fontFamily: 'DM Mono', fontSize: 10, border: '1px solid rgba(45,90,39,0.2)', borderRadius: 3 }} />
              <Bar dataKey="value" radius={[2, 2, 0, 0]}>
                {chartData.map((entry, i) => <Cell key={i} fill={entry.colour} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Quality */}
      <div style={{ ...boxStyle, padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <p style={{ ...monoSm, color: '#5a7a54', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Data Quality</p>
          <p style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: '1.5rem', color: qualityColour }}>{summary.data_quality_score}/100</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ ...monoSm, color: '#0e1a12', opacity: 0.45 }}>{lines.length} lines ({userLines.length} user + {wttLines.length} WTT)</p>
          {summary.estimated_lines > 0 && <p style={{ ...monoSm, color: '#d4a843', marginTop: '0.2rem' }}>{summary.estimated_lines} estimated</p>}
        </div>
      </div>

      {/* SECR Narrative */}
      <div style={boxStyle}>
        <div style={{ padding: '0.75rem 1rem', background: '#e8ede4', borderBottom: '1px solid rgba(45,90,39,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ ...monoSm, color: '#5a7a54', textTransform: 'uppercase' }}>SECR Narrative Draft</p>
          {!narrative && (
            <button onClick={generateNarrative} disabled={narrativeLoading} style={btnStyle(true)}>
              {narrativeLoading ? 'Generating…' : 'Generate with AI'}
            </button>
          )}
        </div>
        {narrative && (
          <div style={{ padding: '1rem 1.25rem' }}>
            <p style={{ fontSize: '0.9rem', lineHeight: 1.7, color: '#0e1a12' }}>{narrative}</p>
            <button onClick={generateNarrative} disabled={narrativeLoading}
              style={{ ...btnStyle(false), marginTop: '0.75rem', fontSize: '0.75rem', padding: '0.3rem 0.75rem' }}>
              Regenerate
            </button>
          </div>
        )}
        {narrativeError && <p style={{ padding: '1rem', color: '#c45c2a', fontFamily: 'DM Mono, monospace', fontSize: '0.75rem' }}>{narrativeError}</p>}
        {!narrative && !narrativeLoading && (
          <p style={{ padding: '1rem', ...monoSm, color: '#0e1a12', opacity: 0.35 }}>
            Click Generate to draft a SECR narrative suitable for your annual report.
          </p>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <button onClick={exportPDF} style={{ ...btnStyle(false), flex: 1 }}>
          ↓ Export Report (HTML)
        </button>
      </div>

      {/* Audit Trail */}
      <div style={boxStyle}>
        <div style={{ padding: '0.75rem 1rem', background: '#e8ede4', borderBottom: '1px solid rgba(45,90,39,0.1)' }}>
          <p style={{ ...monoSm, color: '#5a7a54', textTransform: 'uppercase' }}>Audit Trail — User Inputs</p>
        </div>
        {userLines.map((line, i) => (
          <div key={i} style={{ padding: '0.75rem 1rem', borderBottom: i < userLines.length - 1 ? '1px solid rgba(45,90,39,0.08)' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '0.875rem', fontWeight: 500, color: '#0e1a12', marginBottom: '0.2rem' }}>
                {line.factor.label}
                {line.input.estimated && <span style={{ marginLeft: '0.5rem', fontFamily: 'DM Mono, monospace', fontSize: '0.6rem', padding: '0.1rem 0.4rem', background: 'rgba(212,168,67,0.15)', color: '#d4a843', borderRadius: 2 }}>est.</span>}
              </p>
              <p style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.65rem', color: '#5a7a54' }}>{line.audit.formula}</p>
              <p style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.6rem', color: '#0e1a12', opacity: 0.35, marginTop: '0.15rem' }}>
                {line.audit.source_table} · {line.audit.source_row} · v{line.factor_version}
              </p>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <p style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: '1.1rem', color: '#0e1a12' }}>{line.t_co2e.toFixed(4)}</p>
              <p style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.6rem', color: '#5a7a54' }}>tCO₂e</p>
            </div>
          </div>
        ))}
      </div>

      {/* WTT Lines */}
      {wttLines.length > 0 && (
        <div style={boxStyle}>
          <div style={{ padding: '0.75rem 1rem', background: '#e8ede4', borderBottom: '1px solid rgba(45,90,39,0.1)' }}>
            <p style={{ ...monoSm, color: '#7a5c00', textTransform: 'uppercase' }}>Audit Trail — Well-to-Tank (Auto) · Scope 3</p>
          </div>
          {wttLines.map((line, i) => (
            <div key={i} style={{ padding: '0.75rem 1rem', borderBottom: i < wttLines.length - 1 ? '1px solid rgba(45,90,39,0.08)' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '0.875rem', fontWeight: 500, color: '#0e1a12', marginBottom: '0.2rem' }}>{line.factor.label}</p>
                <p style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.65rem', color: '#5a7a54' }}>{line.audit.formula}</p>
                <p style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.6rem', color: '#0e1a12', opacity: 0.35, marginTop: '0.15rem' }}>
                  {line.audit.source_table} · v{line.factor_version} · auto-calculated
                </p>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <p style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: '1.1rem', color: '#0e1a12' }}>{line.t_co2e.toFixed(4)}</p>
                <p style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.6rem', color: '#5a7a54' }}>tCO₂e</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
