import { NextRequest, NextResponse } from 'next/server'
import type { CalculationResult } from '@/types'

export const maxDuration = 30

interface BrandOptions {
  name?: string      // e.g. "Acme ESG Advisors"
  colour?: string    // hex e.g. "#1a7a3c"
  footer?: string    // custom footer line
}


function renderNarrativeHtml(text: string): string {
  if (!text) return ''
  const blocks = text.split(/(?=\*\*[^*]+\*\*)/).filter(Boolean)
  if (blocks.length <= 1) {
    // Plain text fallback
    return text.split('\n\n').map(p => `<p style="margin:0 0 10px 0">${p}</p>`).join('')
  }
  const colours: Record<string, string> = {
    'Greenhouse Gas Emissions': '#1a7a3c',
    'Scope 3 Emissions':        '#b87a00',
    'Methodology':              '#1a4d8c',
    'Data Quality & Assurance': '#6a8267',
  }
  return blocks.map(block => {
    const m = block.match(/^\*\*([^*]+)\*\*\n?/)
    if (!m) return `<p style="margin:0 0 10px 0">${block.trim()}</p>`
    const label = m[1].trim()
    const body  = block.slice(m[0].length).trim()
    const colour = colours[label] ?? '#4a5e46'
    return `<div style="display:flex;gap:10px;margin-bottom:14px">
      <div style="width:3px;background:${colour};border-radius:2px;flex-shrink:0"></div>
      <div>
        <p style="font-size:9px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:${colour};margin:0 0 4px 0">${label}</p>
        <p style="margin:0;line-height:1.75">${body}</p>
      </div>
    </div>`
  }).join('')
}

function buildHtml(result: CalculationResult, narrative: string, brand: BrandOptions = {}): string {
  const { summary, lines, intensity } = result
  const brandColour = brand.colour || '#1a7a3c'
  const brandName   = brand.name   || 'FreshESG'
  const brandFooter = brand.footer || 'This report has been prepared for SECR (Streamlined Energy and Carbon Reporting) purposes under the Companies Act 2006.'
  const userLines = lines.filter(l => !l.input.notes?.startsWith('Auto WTT'))
  const wttLines  = lines.filter(l =>  l.input.notes?.startsWith('Auto WTT'))
  const total = summary.total_t_co2e

  const pct = (v: number) => total > 0 ? (v / total * 100).toFixed(1) + '%' : '0%'
  const fmt = (n: number, dp = 4) => n.toFixed(dp)

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>SECR Report — ${result.organisation_name}</title>
<style>
  @page { size: A4; margin: 18mm 15mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #141a12; background: #fff; font-size: 11px; line-height: 1.5; }
  :root { --brand: ${brandColour}; }
  .page { max-width: 780px; margin: 0 auto; padding: 28px 20px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 14px; border-bottom: 2px solid var(--brand); margin-bottom: 20px; }
  .header-brand { font-size: 10px; font-weight: 700; color: var(--brand); letter-spacing: .1em; text-transform: uppercase; }
  .header-title { font-size: 15px; font-weight: 800; margin-top: 3px; }
  .header-meta { text-align: right; font-size: 10px; color: #8a9e86; line-height: 1.7; }
  .hero { background: #141a12; color: #fff; border-radius: 10px; padding: 20px 24px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center; }
  .hero-total { font-size: 38px; font-weight: 800; color: #4ca66a; line-height: 1; }
  .hero-sub { font-size: 11px; color: rgba(255,255,255,0.5); margin-top: 4px; }
  .hero-detail { font-size: 10px; color: rgba(255,255,255,0.35); margin-top: 8px; }
  .scope-bar { display: flex; height: 8px; border-radius: 4px; overflow: hidden; margin-bottom: 6px; }
  .scope-legend { display: flex; gap: 14px; font-size: 10px; margin-bottom: 16px; }
  .scope-cards { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 18px; }
  .scope-card { border-radius: 7px; padding: 12px 14px; }
  .scope-card-lbl { font-size: 9px; font-weight: 700; letter-spacing:.05em; text-transform: uppercase; margin-bottom: 5px; }
  .scope-card-val { font-size: 20px; font-weight: 800; line-height: 1; }
  .scope-card-sub { font-size: 10px; margin-top: 3px; opacity: .7; }
  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 18px; }
  .info-block { background: #f6f8f5; border-radius: 6px; padding: 12px 14px; }
  .block-title { font-size: 9px; font-weight: 700; letter-spacing:.07em; text-transform: uppercase; color: #8a9e86; margin-bottom: 8px; }
  .info-row { display: flex; justify-content: space-between; padding: 3px 0; border-bottom: 1px solid #eee; font-size: 10px; }
  .info-row:last-child { border-bottom: none; }
  .info-k { color: #4a5e46; font-weight: 600; }
  .info-v { font-family: 'Courier New', monospace; }
  .narrative-wrap { font-size: 11px; line-height: 1.75; }
  .sec { margin-bottom: 18px; }
  .sec-title { font-size: 9px; font-weight: 700; letter-spacing:.08em; text-transform: uppercase; color: #8a9e86; padding-bottom: 4px; border-bottom: 1px solid #e4eae2; margin-bottom: 10px; }
  table { width: 100%; border-collapse: collapse; font-size: 10px; }
  th { text-align: left; padding: 6px 7px; background: #f6f8f5; color: #4a5e46; font-weight: 700; border-bottom: 2px solid #e4eae2; font-size: 9px; text-transform: uppercase; letter-spacing:.03em; }
  td { padding: 5px 7px; border-bottom: 1px solid #f0f4ee; vertical-align: middle; }
  tr:last-child td { border-bottom: none; }
  .total-row td { font-weight: 700; background: #f0f4ee !important; border-top: 2px solid #c8d8c4; }
  .num { font-family: 'Courier New', monospace; }
  .badge { display: inline-block; padding: 1px 5px; border-radius: 9px; font-size: 8px; font-weight: 700; }
  .s1 { background:#e8f5ec; color:#1a7a3c; } .s2 { background:#eaf0f9; color:#1a4d8c; } .s3 { background:#fdf3dc; color:#b87a00; }
  .est { background:#fdf3dc; color:#b87a00; font-size:8px; padding:1px 4px; border-radius:3px; margin-left:3px; }
  .intensity-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
  .int-card { background: #f6f8f5; border-radius: 6px; padding: 10px; text-align: center; }
  .int-val { font-size: 18px; font-weight: 800; line-height: 1; }
  .int-lbl { font-size: 9px; color: #8a9e86; margin-top: 3px; }
  .pbar { height: 4px; background: #e4eae2; border-radius: 2px; overflow: hidden; margin-top: 3px; }
  .pfill { height: 100%; background: var(--brand); border-radius: 2px; }
  .footer { margin-top: 24px; padding-top: 12px; border-top: 1px solid #e4eae2; display: flex; justify-content: space-between; font-size: 9px; color: #8a9e86; line-height: 1.7; }
  .footer-id { font-family: 'Courier New', monospace; color: #c8d8c4; text-align: right; }
</style>
</head>
<body>
<div class="page">

  <div class="header">
    <div>
      <div class="header-brand">${brandName} · SECR Emissions Report</div>
      <div class="header-title">${result.organisation_name}</div>
    </div>
    <div class="header-meta">
      <div>Period: <strong>${result.reporting_period_start}</strong> → <strong>${result.reporting_period_end}</strong></div>
      <div>Calculated: ${new Date(result.calculated_at).toLocaleString('en-GB')}</div>
      <div style="color:#c8d8c4;font-size:9px;">${result.id}</div>
    </div>
  </div>

  <div class="hero">
    <div>
      <div style="font-size:12px;font-weight:700;color:rgba(255,255,255,0.9);">${result.organisation_name}</div>
      <div style="font-size:10px;color:rgba(255,255,255,0.45);margin-top:2px;">${result.reporting_period_start} to ${result.reporting_period_end}</div>
      <div class="hero-detail">DESNZ ${result.factor_version} · GHG Protocol · Operational control</div>
    </div>
    <div style="text-align:right;">
      <div class="hero-total">${fmt(total, 2)}</div>
      <div class="hero-sub">tCO₂e total emissions</div>
      <div style="font-size:10px;color:rgba(255,255,255,0.3);margin-top:4px;">±${summary.uncertainty_pct}% uncertainty</div>
    </div>
  </div>

  <div class="scope-bar">
    <div style="width:${pct(summary.scope_1_t_co2e)};background:#1a7a3c;"></div>
    <div style="width:${pct(summary.scope_2_t_co2e)};background:#1a4d8c;"></div>
    <div style="width:${pct(summary.scope_3_t_co2e)};background:#b87a00;"></div>
  </div>
  <div class="scope-legend">
    <span style="color:#1a7a3c;">■ Scope 1: ${fmt(summary.scope_1_t_co2e,2)}t (${pct(summary.scope_1_t_co2e)})</span>
    <span style="color:#1a4d8c;">■ Scope 2: ${fmt(summary.scope_2_t_co2e,2)}t (${pct(summary.scope_2_t_co2e)})</span>
    <span style="color:#b87a00;">■ Scope 3: ${fmt(summary.scope_3_t_co2e,2)}t (${pct(summary.scope_3_t_co2e)})</span>
  </div>

  <div class="scope-cards">
    <div class="scope-card" style="background:#e8f5ec;">
      <div class="scope-card-lbl" style="color:#1a7a3c;">Scope 1 — Direct</div>
      <div class="scope-card-val" style="color:#1a7a3c;">${fmt(summary.scope_1_t_co2e,2)}</div>
      <div class="scope-card-sub" style="color:#1a7a3c;">tCO₂e · ${pct(summary.scope_1_t_co2e)}</div>
    </div>
    <div class="scope-card" style="background:#eaf0f9;">
      <div class="scope-card-lbl" style="color:#1a4d8c;">Scope 2 — Electricity</div>
      <div class="scope-card-val" style="color:#1a4d8c;">${fmt(summary.scope_2_t_co2e,2)}</div>
      <div class="scope-card-sub" style="color:#1a4d8c;">tCO₂e · ${pct(summary.scope_2_t_co2e)}</div>
    </div>
    <div class="scope-card" style="background:#fdf3dc;">
      <div class="scope-card-lbl" style="color:#b87a00;">Scope 3 — Indirect</div>
      <div class="scope-card-val" style="color:#b87a00;">${fmt(summary.scope_3_t_co2e,2)}</div>
      <div class="scope-card-sub" style="color:#b87a00;">tCO₂e · ${pct(summary.scope_3_t_co2e)}</div>
    </div>
  </div>

  <div class="two-col">
    <div class="info-block">
      <div class="block-title">Organisation</div>
      <div class="info-row"><span class="info-k">Company</span><span class="info-v">${result.organisation_name}</span></div>
      ${intensity?.employees     ? `<div class="info-row"><span class="info-k">Employees</span><span class="info-v">${intensity.employees.toLocaleString()}</span></div>` : ''}
      ${intensity?.revenue_m     ? `<div class="info-row"><span class="info-k">Revenue</span><span class="info-v">£${intensity.revenue_m}m</span></div>` : ''}
      ${intensity?.floor_area_m2 ? `<div class="info-row"><span class="info-k">Floor area</span><span class="info-v">${intensity.floor_area_m2.toLocaleString()} m²</span></div>` : ''}
      ${summary.sites.length > 1 ? `<div class="info-row"><span class="info-k">Sites</span><span class="info-v">${summary.sites.length}</span></div>` : ''}
    </div>
    <div class="info-block">
      <div class="block-title">Methodology</div>
      <div class="info-row"><span class="info-k">Standard</span><span class="info-v">GHG Protocol Corporate</span></div>
      <div class="info-row"><span class="info-k">Consolidation</span><span class="info-v">Operational control</span></div>
      <div class="info-row"><span class="info-k">Scope 2</span><span class="info-v">Location-based</span></div>
      <div class="info-row"><span class="info-k">Factors</span><span class="info-v">DESNZ ${result.factor_version}</span></div>
      <div class="info-row"><span class="info-k">Quality score</span><span class="info-v">${summary.data_quality_score}/100</span></div>
      <div class="info-row"><span class="info-k">Uncertainty</span><span class="info-v">±${summary.uncertainty_pct}%</span></div>
      ${summary.estimated_lines > 0 ? `<div class="info-row"><span class="info-k">Estimated lines</span><span class="info-v" style="color:#b87a00;">${summary.estimated_lines}</span></div>` : ''}
    </div>
  </div>

  ${result.metadata.factor_version_provisional ? `
  <div style="padding:10px 14px;background:#fdf3dc;border:1px solid #e8c97a;border-radius:7px;margin-bottom:16px;display:flex;gap:10px;align-items:flex-start;">
    <span style="font-size:16px;">⚠</span>
    <div>
      <div style="font-weight:700;color:#b87a00;font-size:11px;">DESNZ 2025 Provisional Factors</div>
      <div style="font-size:10px;color:#b87a00;margin-top:2px;line-height:1.5;">
        This report uses provisional 2025 emission factors. Official DESNZ 2025 values are due June 2026.
        Do not use for final statutory SECR disclosure until official factors are published.
      </div>
    </div>
  </div>` : ''}

  ${narrative ? `
  <div class="sec">
    <div class="sec-title">SECR Narrative</div>
    <div>${renderNarrativeHtml(narrative)}</div>
  </div>` : ''}

  <div class="sec">
    <div class="sec-title">Activity Data — ${userLines.length} emission source${userLines.length !== 1 ? 's' : ''}</div>
    <table>
      <thead>
        <tr>
          <th>Source</th>
          <th>Scope</th>
          <th style="text-align:right;">Quantity</th>
          <th>Unit</th>
          ${summary.sites.length > 1 ? '<th>Site</th>' : ''}
          <th style="text-align:right;">Factor</th>
          <th style="text-align:right;">kg CO₂e</th>
          <th style="text-align:right;">tCO₂e</th>
        </tr>
      </thead>
      <tbody>
        ${userLines.map(l => `
        <tr>
          <td>${l.factor.label}${l.input.estimated ? '<span class="est">est</span>' : ''}</td>
          <td><span class="badge s${l.scope}">S${l.scope}</span></td>
          <td class="num" style="text-align:right;">${l.input.quantity.toLocaleString()}</td>
          <td>${l.input.unit}</td>
          ${summary.sites.length > 1 ? `<td>${l.input.site || '—'}</td>` : ''}
          <td class="num" style="text-align:right;">${l.factor.kg_co2e_per_unit}</td>
          <td class="num" style="text-align:right;">${fmt(l.kg_co2e, 3)}</td>
          <td class="num" style="text-align:right;font-weight:700;">${fmt(l.t_co2e, 4)}</td>
        </tr>`).join('')}
        <tr class="total-row">
          <td colspan="${summary.sites.length > 1 ? 5 : 4}"><strong>Total</strong></td>
          <td></td>
          <td class="num" style="text-align:right;">${fmt(total * 1000, 2)} kg</td>
          <td class="num" style="text-align:right;"><strong>${fmt(total, 4)}</strong></td>
        </tr>
      </tbody>
    </table>
  </div>

  ${summary.sites.length > 1 ? `
  <div class="sec">
    <div class="sec-title">Site Breakdown</div>
    <table>
      <thead>
        <tr>
          <th>Site</th>
          <th style="text-align:right;">Scope 1</th>
          <th style="text-align:right;">Scope 2</th>
          <th style="text-align:right;">Scope 3</th>
          <th style="text-align:right;">Total tCO₂e</th>
          <th style="text-align:right;">Share</th>
        </tr>
      </thead>
      <tbody>
        ${summary.sites.map(s => `
        <tr>
          <td>
            <strong>${s.site}</strong>
            <div class="pbar"><div class="pfill" style="width:${total>0?(s.t_co2e/total*100).toFixed(1):0}%;"></div></div>
          </td>
          <td class="num" style="text-align:right;">${fmt(s.scope_1)}</td>
          <td class="num" style="text-align:right;">${fmt(s.scope_2)}</td>
          <td class="num" style="text-align:right;">${fmt(s.scope_3)}</td>
          <td class="num" style="text-align:right;font-weight:700;">${fmt(s.t_co2e)}</td>
          <td class="num" style="text-align:right;">${pct(s.t_co2e)}</td>
        </tr>`).join('')}
      </tbody>
    </table>
  </div>` : ''}

  ${intensity && (intensity.per_employee || intensity.per_revenue_m || intensity.per_floor_area) ? `
  <div class="sec">
    <div class="sec-title">Intensity Metrics</div>
    <div class="intensity-grid">
      ${intensity.per_employee    ? `<div class="int-card"><div class="int-val" style="color:#1a7a3c;">${intensity.per_employee.toFixed(3)}</div><div class="int-lbl">tCO₂e per employee</div></div>` : ''}
      ${intensity.per_revenue_m   ? `<div class="int-card"><div class="int-val" style="color:#1a4d8c;">${intensity.per_revenue_m.toFixed(3)}</div><div class="int-lbl">tCO₂e per £m revenue</div></div>` : ''}
      ${intensity.per_floor_area  ? `<div class="int-card"><div class="int-val" style="color:#b87a00;">${intensity.per_floor_area.toFixed(4)}</div><div class="int-lbl">tCO₂e per m² floor area</div></div>` : ''}
    </div>
  </div>` : ''}

  ${wttLines.length > 0 ? `
  <div class="sec">
    <div class="sec-title">Well-to-Tank (Scope 3 Cat 3) — Auto-calculated</div>
    <table>
      <thead>
        <tr>
          <th>WTT Source</th>
          <th style="text-align:right;">Quantity</th>
          <th>Unit</th>
          <th style="text-align:right;">Factor</th>
          <th style="text-align:right;">kg CO₂e</th>
          <th style="text-align:right;">tCO₂e</th>
        </tr>
      </thead>
      <tbody>
        ${wttLines.map(l => `
        <tr>
          <td>${l.factor.label}</td>
          <td class="num" style="text-align:right;">${l.input.quantity.toLocaleString()}</td>
          <td>${l.input.unit}</td>
          <td class="num" style="text-align:right;">${l.factor.kg_co2e_per_unit}</td>
          <td class="num" style="text-align:right;">${fmt(l.kg_co2e, 3)}</td>
          <td class="num" style="text-align:right;font-weight:700;">${fmt(l.t_co2e, 4)}</td>
        </tr>`).join('')}
        <tr class="total-row">
          <td colspan="4"><strong>WTT Total</strong></td>
          <td class="num" style="text-align:right;">${fmt(wttLines.reduce((a,l)=>a+l.kg_co2e,0),2)} kg</td>
          <td class="num" style="text-align:right;"><strong>${fmt(wttLines.reduce((a,l)=>a+l.t_co2e,0),4)}</strong></td>
        </tr>
      </tbody>
    </table>
  </div>` : ''}

  <div class="footer">
    <div>
      <strong>Methodology:</strong> UK GHG Protocol Corporate Standard · Operational control · Location-based Scope 2<br/>
      <strong>Conversion factors:</strong> UK Government GHG Conversion Factors ${result.factor_version} (DESNZ)<br/>
      ${brandFooter}
    </div>
    <div class="footer-id">
      ${result.id}<br/>
      ${new Date(result.calculated_at).toLocaleString('en-GB')}
    </div>
  </div>

</div>
</body>
</html>`
}

export async function POST(req: NextRequest) {
  try {
    const { result, narrative, brand } = await req.json() as { result: CalculationResult; narrative?: string; brand?: BrandOptions }
    const html = buildHtml(result, narrative || '', brand || {})
    const filename = `${result.organisation_name.replace(/\s+/g, '-')}-SECR-${result.reporting_period_start}.html`
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Report generation failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
