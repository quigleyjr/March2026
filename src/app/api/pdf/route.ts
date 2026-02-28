import { NextRequest, NextResponse } from 'next/server'
import type { CalculationResult } from '@/types'

function buildHtml(result: CalculationResult, narrative: string): string {
  const { summary, lines, factor_version, organisation_name, reporting_period_start, reporting_period_end, id, intensity } = result
  const userLines = lines.filter(l => !l.input.notes?.startsWith('Auto WTT'))
  const wttLines = lines.filter(l => l.input.notes?.startsWith('Auto WTT'))

  const sitesHtml = summary.sites.length > 1 ? `
    <h2 class="section-head">Site Breakdown</h2>
    <table><thead><tr><th>Site</th><th>Scope 1</th><th>Scope 2</th><th>Scope 3</th><th>Total tCO₂e</th></tr></thead><tbody>
    ${summary.sites.map(s => `<tr><td>${s.site}</td><td>${s.scope_1.toFixed(4)}</td><td>${s.scope_2.toFixed(4)}</td><td>${s.scope_3.toFixed(4)}</td><td><strong>${s.t_co2e.toFixed(4)}</strong></td></tr>`).join('')}
    </tbody></table>` : ''

  const intensityHtml = intensity && (intensity.per_employee || intensity.per_revenue_m) ? `
    <h2 class="section-head">Intensity Metrics</h2>
    <table><tbody>
    ${intensity.per_employee ? `<tr><td>tCO₂e per employee</td><td><strong>${intensity.per_employee.toFixed(4)}</strong></td></tr>` : ''}
    ${intensity.per_revenue_m ? `<tr><td>tCO₂e per £m revenue</td><td><strong>${intensity.per_revenue_m.toFixed(4)}</strong></td></tr>` : ''}
    ${intensity.per_floor_area ? `<tr><td>tCO₂e per m² floor area</td><td><strong>${intensity.per_floor_area.toFixed(4)}</strong></td></tr>` : ''}
    </tbody></table>` : ''

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Georgia, serif; color: #141a12; line-height: 1.65; font-size: 13px; padding: 48px 56px; }
  h1 { font-size: 28px; font-weight: 900; margin-bottom: 4px; letter-spacing: -0.5px; }
  .sub { color: #8a9e86; font-size: 11px; margin-bottom: 32px; font-family: monospace; }
  .total { background: #141a12; color: #e8f5ec; padding: 24px 28px; border-radius: 10px; margin-bottom: 20px; }
  .total-label { font-size: 10px; letter-spacing: 1.2px; text-transform: uppercase; opacity: 0.45; margin-bottom: 6px; font-family: monospace; }
  .total-num { font-size: 52px; font-weight: 900; line-height: 1; letter-spacing: -2px; }
  .total-unit { font-size: 16px; opacity: 0.4; margin-left: 8px; font-weight: 400; }
  .total-meta { font-family: monospace; font-size: 10px; opacity: 0.3; margin-top: 8px; }
  .scopes { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 20px; }
  .scope { border: 1px solid #e4eae2; border-radius: 8px; padding: 14px 16px; }
  .scope-label { font-size: 9px; font-family: monospace; letter-spacing: 1px; text-transform: uppercase; color: #8a9e86; margin-bottom: 4px; }
  .scope-val { font-size: 22px; font-weight: 900; letter-spacing: -0.5px; }
  .scope-unit { font-size: 10px; color: #8a9e86; margin-top: 2px; font-family: monospace; }
  .section-head { font-family: monospace; font-size: 10px; letter-spacing: 1px; text-transform: uppercase; color: #4a5e46; margin: 24px 0 10px; }
  .narrative-box { background: #f6f8f5; border-left: 3px solid #1a7a3c; padding: 14px 18px; margin-bottom: 20px; border-radius: 0 6px 6px 0; }
  .narrative-label { font-family: monospace; font-size: 9px; letter-spacing: 1px; text-transform: uppercase; color: #1a7a3c; margin-bottom: 8px; }
  .narrative-text { font-size: 12.5px; line-height: 1.75; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
  th { text-align: left; padding: 7px 10px; background: #f0f4ee; font-family: monospace; font-size: 9px; letter-spacing: 0.8px; text-transform: uppercase; color: #4a5e46; }
  td { padding: 7px 10px; border-bottom: 1px solid #f0f4ee; font-size: 12px; vertical-align: top; }
  td.formula { font-family: monospace; font-size: 10px; color: #8a9e86; }
  .intensity-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 20px; }
  .intensity-card { border: 1px solid #e4eae2; border-radius: 8px; padding: 14px 16px; }
  .intensity-label { font-size: 9px; font-family: monospace; letter-spacing: 1px; text-transform: uppercase; color: #8a9e86; margin-bottom: 4px; }
  .intensity-val { font-size: 22px; font-weight: 900; letter-spacing: -0.5px; }
  .intensity-unit { font-size: 10px; color: #8a9e86; margin-top: 2px; font-family: monospace; }
  .footer { font-family: monospace; font-size: 9px; color: #8a9e86; border-top: 1px solid #e4eae2; padding-top: 14px; margin-top: 28px; line-height: 1.8; }
  .tag { display: inline-block; font-family: monospace; font-size: 9px; padding: 1px 6px; border-radius: 10px; margin-left: 4px; }
  .tag-site { background: #e8f5ec; color: #1a7a3c; }
  .tag-est { background: #fdf3dc; color: #b87a00; }
</style>
</head>
<body>

<h1>${organisation_name}</h1>
<div class="sub">SECR Emissions Report &nbsp;·&nbsp; ${reporting_period_start} to ${reporting_period_end} &nbsp;·&nbsp; Generated ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</div>

<div class="total">
  <div class="total-label">Total Emissions</div>
  <div class="total-num">${summary.total_t_co2e.toLocaleString('en-GB', { maximumFractionDigits: 2 })}<span class="total-unit">tCO₂e</span></div>
  <div class="total-meta">±${summary.uncertainty_pct}% uncertainty &nbsp;·&nbsp; DESNZ ${factor_version} &nbsp;·&nbsp; Data quality ${summary.data_quality_score}/100</div>
</div>

<div class="scopes">
  <div class="scope">
    <div class="scope-label">Scope 1 — Direct</div>
    <div class="scope-val">${summary.scope_1_t_co2e.toLocaleString('en-GB', { maximumFractionDigits: 4 })}</div>
    <div class="scope-unit">tCO₂e &nbsp;·&nbsp; ${summary.total_t_co2e > 0 ? (summary.scope_1_t_co2e / summary.total_t_co2e * 100).toFixed(1) : 0}%</div>
  </div>
  <div class="scope">
    <div class="scope-label">Scope 2 — Electricity</div>
    <div class="scope-val">${summary.scope_2_t_co2e.toLocaleString('en-GB', { maximumFractionDigits: 4 })}</div>
    <div class="scope-unit">tCO₂e &nbsp;·&nbsp; ${summary.total_t_co2e > 0 ? (summary.scope_2_t_co2e / summary.total_t_co2e * 100).toFixed(1) : 0}%</div>
  </div>
  <div class="scope">
    <div class="scope-label">Scope 3 — Upstream</div>
    <div class="scope-val">${summary.scope_3_t_co2e.toLocaleString('en-GB', { maximumFractionDigits: 4 })}</div>
    <div class="scope-unit">tCO₂e &nbsp;·&nbsp; ${summary.total_t_co2e > 0 ? (summary.scope_3_t_co2e / summary.total_t_co2e * 100).toFixed(1) : 0}%</div>
  </div>
</div>

${narrative ? `
<div class="narrative-box">
  <div class="narrative-label">SECR Narrative</div>
  <p class="narrative-text">${narrative}</p>
</div>` : ''}

${sitesHtml}

${intensity && (intensity.per_employee || intensity.per_revenue_m || intensity.per_floor_area) ? `
<h2 class="section-head">Intensity Metrics</h2>
<div class="intensity-grid">
  ${intensity.per_employee ? `<div class="intensity-card"><div class="intensity-label">Per Employee</div><div class="intensity-val">${intensity.per_employee.toFixed(3)}</div><div class="intensity-unit">tCO₂e / employee &nbsp;·&nbsp; ${intensity.employees?.toLocaleString()} FTE</div></div>` : ''}
  ${intensity.per_revenue_m ? `<div class="intensity-card"><div class="intensity-label">Per £m Revenue</div><div class="intensity-val">${intensity.per_revenue_m.toFixed(3)}</div><div class="intensity-unit">tCO₂e / £m &nbsp;·&nbsp; £${intensity.revenue_m}m revenue</div></div>` : ''}
  ${intensity.per_floor_area ? `<div class="intensity-card"><div class="intensity-label">Per m² Floor Area</div><div class="intensity-val">${intensity.per_floor_area.toFixed(4)}</div><div class="intensity-unit">tCO₂e / m² &nbsp;·&nbsp; ${intensity.floor_area_m2?.toLocaleString()} m²</div></div>` : ''}
</div>` : ''}

<h2 class="section-head">Audit Trail — Activity Inputs</h2>
<table>
  <thead><tr><th>Source</th><th>Quantity</th><th>Factor (kg CO₂e/unit)</th><th>tCO₂e</th><th>Scope</th>${summary.sites.length > 1 ? '<th>Site</th>' : ''}</tr></thead>
  <tbody>
    ${userLines.map(l => `
    <tr>
      <td>${l.factor.label}${l.input.estimated ? '<span class="tag tag-est">estimated</span>' : ''}${l.input.site ? `<span class="tag tag-site">📍 ${l.input.site}</span>` : ''}</td>
      <td>${l.input.quantity.toLocaleString()} ${l.input.unit}</td>
      <td class="formula">${l.audit.kg_co2e_per_unit}<br><span style="opacity:0.6">${l.audit.source_table} · ${l.audit.source_row}</span></td>
      <td><strong>${l.t_co2e.toFixed(4)}</strong></td>
      <td>${l.scope}</td>
      ${summary.sites.length > 1 ? `<td>${l.input.site || '—'}</td>` : ''}
    </tr>`).join('')}
  </tbody>
</table>

${wttLines.length ? `
<h2 class="section-head">Well-to-Tank — Auto-calculated · Scope 3</h2>
<table>
  <thead><tr><th>Source</th><th>Quantity</th><th>tCO₂e</th></tr></thead>
  <tbody>
    ${wttLines.map(l => `<tr><td>${l.factor.label}</td><td>${l.input.quantity.toLocaleString()} ${l.input.unit}</td><td>${l.t_co2e.toFixed(4)}</td></tr>`).join('')}
  </tbody>
</table>` : ''}

<div class="footer">
  Calculation ID: ${id}<br>
  Methodology: GHG Protocol Corporate Standard (2015) · Consolidation: Operational Control · Scope 2 Method: Location-Based<br>
  Conversion Factors: UK Government GHG Conversion Factors, DESNZ ${factor_version} · Factor effective date: 1 January 2024<br>
  Generated by February2026 · ${new Date().toISOString()}
</div>

</body>
</html>`
}

export async function POST(req: NextRequest) {
  try {
    const { result, narrative } = await req.json() as { result: CalculationResult; narrative?: string }

    const html = buildHtml(result, narrative || '')

    // Use puppeteer-core + @sparticuz/chromium for serverless PDF generation
    const chromium = await import('@sparticuz/chromium')
    const puppeteer = await import('puppeteer-core')

    const browser = await puppeteer.default.launch({
      args: chromium.default.args,
      defaultViewport: chromium.default.defaultViewport,
      executablePath: await chromium.default.executablePath(),
      headless: true,
    })

    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle0' })

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    })

    await browser.close()

    const filename = `${result.organisation_name.replace(/\s+/g, '-')}-SECR-${result.reporting_period_start}.pdf`

    return new NextResponse(pdf, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'PDF generation failed'
    console.error('PDF error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
