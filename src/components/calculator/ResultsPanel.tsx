'use client'

import { useState } from 'react'
import type { CalculationResult } from '@/types'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface Props { result: CalculationResult }

const SCOPE_COLOURS = ['#1a7a3c', '#1a4d8c', '#b87a00']
const SCOPE_LIGHTS  = ['var(--green-light)', 'var(--blue-light)', 'var(--amber-light)']

export function ResultsPanel({ result }: Props) {
  const { summary, lines, factor_version, organisation_name, reporting_period_start, reporting_period_end, id } = result
  const [narrative, setNarrative] = useState('')
  const [narrativeLoading, setNarrativeLoading] = useState(false)
  const [narrativeError, setNarrativeError] = useState('')

  const userLines = lines.filter(l => !l.input.notes?.startsWith('Auto WTT'))
  const wttLines  = lines.filter(l =>  l.input.notes?.startsWith('Auto WTT'))

  const chartData = [
    { name: 'Scope 1', value: summary.scope_1_t_co2e, colour: SCOPE_COLOURS[0] },
    { name: 'Scope 2', value: summary.scope_2_t_co2e, colour: SCOPE_COLOURS[1] },
    { name: 'Scope 3', value: summary.scope_3_t_co2e, colour: SCOPE_COLOURS[2] },
  ].filter(d => d.value > 0)

  const qualityColour = summary.data_quality_score >= 80 ? 'var(--green)' : summary.data_quality_score >= 50 ? 'var(--amber)' : 'var(--red)'

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
      setNarrativeError(e instanceof Error ? e.message : 'Failed')
    } finally {
      setNarrativeLoading(false)
    }
  }

  function exportReport() {
    const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>SECR — ${organisation_name}</title>
<style>
body{font-family:Georgia,serif;max-width:720px;margin:48px auto;color:#141a12;line-height:1.7;padding:0 24px}
h1{font-size:2rem;margin-bottom:4px}
.sub{color:#8a9e86;font-size:0.85rem;margin-bottom:32px;font-family:monospace}
.total{background:#141a12;color:#e8f5ec;padding:28px 32px;border-radius:12px;margin-bottom:24px}
.total-label{font-size:0.75rem;letter-spacing:0.1em;text-transform:uppercase;opacity:0.5;margin-bottom:8px;font-family:monospace}
.total-num{font-size:3.5rem;font-weight:bold;line-height:1}
.total-unit{font-size:1rem;opacity:0.5;margin-left:8px}
.scopes{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:24px}
.scope{border:1px solid #e4eae2;border-radius:10px;padding:16px;text-align:center}
.scope-label{font-size:0.7rem;font-family:monospace;letter-spacing:0.08em;text-transform:uppercase;color:#8a9e86;margin-bottom:6px}
.scope-val{font-size:1.5rem;font-weight:bold}
table{width:100%;border-collapse:collapse;margin-bottom:24px;font-size:0.85rem}
th{text-align:left;padding:8px 12px;background:#f0f4ee;font-family:monospace;font-size:0.7rem;letter-spacing:0.06em;text-transform:uppercase;color:#4a5e46}
td{padding:8px 12px;border-bottom:1px solid #f0f4ee}
.formula{font-family:monospace;font-size:0.68rem;color:#8a9e86}
.narrative-box{background:#f6f8f5;border-left:3px solid #1a7a3c;padding:16px 20px;margin-bottom:24px;border-radius:0 8px 8px 0}
.narrative-label{font-family:monospace;font-size:0.7rem;letter-spacing:0.08em;text-transform:uppercase;color:#1a7a3c;margin-bottom:10px}
.footer{font-family:monospace;font-size:0.65rem;color:#8a9e86;border-top:1px solid #e4eae2;padding-top:16px;margin-top:32px}
</style></head><body>
<h1>${organisation_name}</h1>
<div class="sub">SECR Emissions Report &nbsp;·&nbsp; ${reporting_period_start} to ${reporting_period_end} &nbsp;·&nbsp; Generated ${new Date().toLocaleDateString('en-GB')}</div>
<div class="total">
  <div class="total-label">Total Emissions</div>
  <div class="total-num">${summary.total_t_co2e.toLocaleString('en-GB', { maximumFractionDigits: 2 })}<span class="total-unit">tCO₂e</span></div>
  <div style="font-family:monospace;font-size:0.72rem;opacity:0.4;margin-top:8px">±${summary.uncertainty_pct}% uncertainty · DESNZ ${factor_version}</div>
</div>
<div class="scopes">
  <div class="scope"><div class="scope-label">Scope 1</div><div class="scope-val">${summary.scope_1_t_co2e}</div></div>
  <div class="scope"><div class="scope-label">Scope 2</div><div class="scope-val">${summary.scope_2_t_co2e}</div></div>
  <div class="scope"><div class="scope-label">Scope 3</div><div class="scope-val">${summary.scope_3_t_co2e}</div></div>
</div>
${narrative ? `<div class="narrative-box"><div class="narrative-label">SECR Narrative</div><p>${narrative}</p></div>` : ''}
<h2 style="font-family:monospace;font-size:0.78rem;letter-spacing:0.08em;text-transform:uppercase;color:#4a5e46;margin-bottom:12px">Audit Trail</h2>
<table><thead><tr><th>Source</th><th>Quantity</th><th>Factor</th><th>tCO₂e</th><th>Scope</th></tr></thead><tbody>
${userLines.map(l => `<tr><td>${l.factor.label}</td><td>${l.input.quantity.toLocaleString()} ${l.input.unit}</td><td class="formula">${l.audit.kg_co2e_per_unit}</td><td><strong>${l.t_co2e.toFixed(4)}</strong></td><td>${l.scope}</td></tr>`).join('')}
</tbody></table>
${wttLines.length ? `<h2 style="font-family:monospace;font-size:0.78rem;letter-spacing:0.08em;text-transform:uppercase;color:#4a5e46;margin-bottom:12px">Well-to-Tank (Auto · Scope 3)</h2>
<table><thead><tr><th>Source</th><th>Quantity</th><th>tCO₂e</th></tr></thead><tbody>
${wttLines.map(l => `<tr><td>${l.factor.label}</td><td>${l.input.quantity.toLocaleString()} ${l.input.unit}</td><td>${l.t_co2e.toFixed(4)}</td></tr>`).join('')}
</tbody></table>` : ''}
<div class="footer">Calc ID: ${id} &nbsp;·&nbsp; GHG Protocol Corporate Standard &nbsp;·&nbsp; DESNZ ${factor_version} &nbsp;·&nbsp; Operational Control &nbsp;·&nbsp; Location-Based Scope 2 &nbsp;·&nbsp; Quality: ${summary.data_quality_score}/100</div>
</body></html>`
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([html], { type: 'text/html' }))
    a.download = `${organisation_name.replace(/\s+/g, '-')}-SECR-${reporting_period_start}.html`
    a.click()
  }

  const card = {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden',
  }
  const cardPad = { padding: '1rem 1.125rem' }
  const cardHead = {
    padding: '0.6rem 1.125rem',
    background: 'var(--surface-2)',
    borderBottom: '1px solid var(--border)',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  }
  const label = {
    fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem',
    fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' as const,
    color: 'var(--text-3)',
  }
  const mono = { fontFamily: 'JetBrains Mono, monospace' }

  const btnPrimary = {
    padding: '0.4rem 0.875rem', fontSize: '0.78rem', fontWeight: 700,
    background: 'var(--green)', color: 'white', border: 'none',
    borderRadius: 'var(--radius-xs)', cursor: 'pointer',
    boxShadow: '0 1px 4px rgba(26,122,60,0.2)',
  }
  const btnSecondary = {
    padding: '0.4rem 0.875rem', fontSize: '0.78rem', fontWeight: 600,
    background: 'var(--surface)', color: 'var(--text-2)',
    border: '1px solid var(--border)', borderRadius: 'var(--radius-xs)', cursor: 'pointer',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

      {/* Total hero card */}
      <div style={{ background: 'var(--text)', borderRadius: 'var(--radius)', padding: '1.5rem', boxShadow: 'var(--shadow)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div>
            <p style={{ ...label, color: 'rgba(232,245,236,0.45)', marginBottom: '0.5rem' }}>Total Emissions</p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
              <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '3.25rem', color: '#e8f5ec', letterSpacing: '-0.03em', lineHeight: 1 }}>
                {summary.total_t_co2e.toLocaleString('en-GB', { maximumFractionDigits: 2 })}
              </span>
              <span style={{ fontSize: '1rem', color: 'rgba(232,245,236,0.5)', fontWeight: 400 }}>tCO₂e</span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
              background: 'rgba(232,245,236,0.08)', borderRadius: 20,
              padding: '0.3rem 0.75rem', marginBottom: '0.5rem',
            }}>
              <span style={{ ...label, color: 'rgba(232,245,236,0.5)', fontSize: '0.6rem' }}>±{summary.uncertainty_pct}%</span>
            </div>
            <p style={{ ...mono, fontSize: '0.62rem', color: 'rgba(232,245,236,0.3)' }}>DESNZ {factor_version}</p>
          </div>
        </div>
        <div style={{ borderTop: '1px solid rgba(232,245,236,0.08)', paddingTop: '0.875rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ ...mono, fontSize: '0.72rem', color: 'rgba(232,245,236,0.35)' }}>
            {organisation_name} · {reporting_period_start} → {reporting_period_end}
          </p>
          <p style={{ ...mono, fontSize: '0.6rem', color: 'rgba(232,245,236,0.2)' }}>{id}</p>
        </div>
      </div>

      {/* Scope cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
        {[1, 2, 3].map((s, i) => {
          const val = [summary.scope_1_t_co2e, summary.scope_2_t_co2e, summary.scope_3_t_co2e][i]
          const pct = summary.total_t_co2e > 0 ? (val / summary.total_t_co2e * 100).toFixed(1) : '0'
          return (
            <div key={s} style={{ background: SCOPE_LIGHTS[i], border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '0.875rem 1rem' }}>
              <p style={{ ...label, color: SCOPE_COLOURS[i], marginBottom: '0.4rem' }}>Scope {s}</p>
              <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.4rem', color: 'var(--text)', letterSpacing: '-0.02em', lineHeight: 1 }}>
                {val.toLocaleString('en-GB', { maximumFractionDigits: 2 })}
              </p>
              <p style={{ ...mono, fontSize: '0.65rem', color: 'var(--text-3)', marginTop: '0.25rem' }}>{pct}%</p>
            </div>
          )
        })}
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <div style={card}>
          <div style={cardHead}><span style={label}>Breakdown by scope</span></div>
          <div style={cardPad}>
            <ResponsiveContainer width="100%" height={110}>
              <BarChart data={chartData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 10, fontFamily: 'JetBrains Mono', fill: 'var(--text-3)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fontFamily: 'JetBrains Mono', fill: 'var(--text-3)' }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v: number) => [`${v.toFixed(4)} tCO₂e`, '']}
                  contentStyle={{ fontFamily: 'JetBrains Mono', fontSize: 10, border: '1px solid var(--border)', borderRadius: 6, boxShadow: 'var(--shadow-sm)' }} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, i) => <Cell key={i} fill={entry.colour} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Quality + actions row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
        <div style={{ ...card, ...cardPad }}>
          <p style={{ ...label, marginBottom: '0.4rem' }}>Data Quality</p>
          <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.75rem', color: qualityColour, letterSpacing: '-0.02em', lineHeight: 1 }}>
            {summary.data_quality_score}<span style={{ fontSize: '0.9rem', opacity: 0.4, fontFamily: 'Plus Jakarta Sans' }}>/100</span>
          </p>
          <p style={{ ...mono, fontSize: '0.65rem', color: 'var(--text-3)', marginTop: '0.3rem' }}>
            {lines.length} lines · {wttLines.length} WTT auto
          </p>
        </div>
        <div style={{ ...card, ...cardPad, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '0.5rem' }}>
          <button onClick={exportReport} style={btnSecondary}>↓ Export HTML report</button>
        </div>
      </div>

      {/* SECR Narrative */}
      <div style={card}>
        <div style={cardHead}>
          <span style={label}>SECR Narrative</span>
          <button onClick={generateNarrative} disabled={narrativeLoading} style={btnPrimary}>
            {narrativeLoading ? 'Generating…' : narrative ? 'Regenerate' : 'Generate with AI ✦'}
          </button>
        </div>
        {narrative ? (
          <div style={{ ...cardPad, borderTop: '1px solid var(--border)' }}>
            <p style={{ fontSize: '0.875rem', lineHeight: 1.75, color: 'var(--text)' }}>{narrative}</p>
          </div>
        ) : narrativeError ? (
          <p style={{ ...cardPad, ...mono, fontSize: '0.75rem', color: 'var(--red)' }}>{narrativeError}</p>
        ) : (
          <p style={{ ...cardPad, ...mono, fontSize: '0.72rem', color: 'var(--text-3)' }}>
            Click Generate to draft a SECR-compliant narrative for your annual report.
          </p>
        )}
      </div>

      {/* User audit trail */}
      <div style={card}>
        <div style={cardHead}><span style={label}>Audit Trail — Activity Inputs</span></div>
        {userLines.map((line, i) => (
          <div key={i} style={{
            ...cardPad, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem',
            borderBottom: i < userLines.length - 1 ? '1px solid var(--border)' : 'none',
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text)' }}>{line.factor.label}</p>
                {line.input.estimated && (
                  <span style={{ ...mono, fontSize: '0.6rem', padding: '0.1rem 0.4rem', background: 'var(--amber-light)', color: 'var(--amber)', borderRadius: 20 }}>estimated</span>
                )}
              </div>
              <p style={{ ...mono, fontSize: '0.68rem', color: 'var(--text-3)' }}>{line.audit.formula}</p>
              <p style={{ ...mono, fontSize: '0.6rem', color: 'var(--border-strong)', marginTop: '0.2rem' }}>
                {line.audit.source_table} · {line.audit.source_row} · v{line.factor_version}
              </p>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1.1rem', color: 'var(--text)' }}>{line.t_co2e.toFixed(4)}</p>
              <p style={{ ...mono, fontSize: '0.6rem', color: 'var(--text-3)' }}>tCO₂e</p>
            </div>
          </div>
        ))}
      </div>

      {/* WTT audit trail */}
      {wttLines.length > 0 && (
        <div style={card}>
          <div style={cardHead}>
            <span style={{ ...label, color: 'var(--amber)' }}>Well-to-Tank — Auto-calculated · Scope 3</span>
          </div>
          {wttLines.map((line, i) => (
            <div key={i} style={{
              ...cardPad, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              borderBottom: i < wttLines.length - 1 ? '1px solid var(--border)' : 'none',
            }}>
              <div>
                <p style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text)', marginBottom: '0.2rem' }}>{line.factor.label}</p>
                <p style={{ ...mono, fontSize: '0.65rem', color: 'var(--text-3)' }}>{line.audit.formula}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1rem', color: 'var(--text)' }}>{line.t_co2e.toFixed(4)}</p>
                <p style={{ ...mono, fontSize: '0.6rem', color: 'var(--text-3)' }}>tCO₂e</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
