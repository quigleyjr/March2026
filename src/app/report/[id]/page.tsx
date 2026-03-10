import { notFound } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import type { CalculationResult } from '@/types'

interface Props { params: { id: string } }

export default async function SharedReportPage({ params }: Props) {
  const { data, error } = await supabase
    .from('calculations')
    .select('result_json, share_enabled, organisation_name, reporting_period_start, reporting_period_end, total_t_co2e, scope_1_t_co2e, scope_2_t_co2e, scope_3_t_co2e, factor_version')
    .eq('share_token', params.id)
    .eq('share_enabled', true)
    .single()

  if (error || !data) notFound()

  const result = data.result_json as CalculationResult
  const { summary, intensity } = result
  const total = summary.total_t_co2e
  const pct = (v: number) => total > 0 ? (v / total * 100).toFixed(1) : '0'

  const scopeColour = ['', '#1a7a3c', '#1a4d8c', '#b87a00']
  const scopeBg     = ['', '#e8f5ec', '#eaf0f9', '#fdf3dc']

  const userLines = result.lines.filter(l => !l.input.notes?.startsWith('Auto WTT'))

  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>SECR Report — {data.organisation_name}</title>
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Syne:wght@700;800&display=swap" rel="stylesheet" />
        <style>{`
          *{box-sizing:border-box;margin:0;padding:0}
          body{font-family:'Plus Jakarta Sans',sans-serif;background:#f6f8f5;color:#141a12;font-size:14px;line-height:1.6;-webkit-font-smoothing:antialiased}
          .wrap{max-width:860px;margin:0 auto;padding:32px 20px}
          .card{background:#fff;border:1px solid #e4eae2;border-radius:12px;padding:24px;margin-bottom:16px;box-shadow:0 1px 3px rgba(20,26,18,.06)}
          .hero{background:#141a12;color:#fff;border-radius:12px;padding:28px 32px;margin-bottom:16px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px}
          .hero-total{font-family:'Syne',sans-serif;font-size:3rem;font-weight:800;color:#4ca66a;line-height:1}
          .scope-bar{height:8px;border-radius:4px;overflow:hidden;display:flex;margin:12px 0}
          .sec-title{font-size:11px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:#8a9e86;padding-bottom:6px;border-bottom:1px solid #e4eae2;margin-bottom:14px}
          table{width:100%;border-collapse:collapse;font-size:12px}
          th{text-align:left;padding:8px 10px;background:#f6f8f5;color:#4a5e46;font-weight:700;border-bottom:2px solid #e4eae2;font-size:11px;text-transform:uppercase;letter-spacing:.04em}
          td{padding:7px 10px;border-bottom:1px solid #f0f4ee;vertical-align:middle}
          tr:last-child td{border-bottom:none}
          .badge{display:inline-block;padding:1px 7px;border-radius:10px;font-size:10px;font-weight:700}
          .num{font-family:monospace}
          .total-row td{font-weight:700;background:#f0f4ee!important;border-top:2px solid #c8d8c4}
          .scope-card{border-radius:8px;padding:16px;flex:1;min-width:140px}
          .watermark{text-align:center;padding:24px;color:#c8d8c4;font-size:12px;margin-top:8px}
          .watermark a{color:#1a7a3c;text-decoration:none;font-weight:600}
          @media(max-width:600px){.hero{flex-direction:column}.hero-total{font-size:2.2rem}}
        `}</style>
      </head>
      <body>
        <div className="wrap">

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 18, color: '#141a12' }}>
              Fresh<span style={{ color: '#1a7a3c' }}>ESG</span>
            </div>
            <div style={{ fontSize: 11, color: '#8a9e86', textAlign: 'right' }}>
              SECR Emissions Report<br />
              <span style={{ fontFamily: 'monospace' }}>{data.reporting_period_start} → {data.reporting_period_end}</span>
            </div>
          </div>

          {/* Hero */}
          <div className="hero">
            <div>
              <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 800 }}>{data.organisation_name}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 4 }}>{data.reporting_period_start} to {data.reporting_period_end}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 6 }}>DESNZ {data.factor_version} · GHG Protocol · Operational control</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="hero-total">{total.toFixed(2)}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>tCO₂e total</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>±{summary.uncertainty_pct}% uncertainty</div>
            </div>
          </div>

          {/* Scope bar */}
          <div className="scope-bar">
            <div style={{ width: `${pct(summary.scope_1_t_co2e)}%`, background: '#1a7a3c' }} />
            <div style={{ width: `${pct(summary.scope_2_t_co2e)}%`, background: '#1a4d8c' }} />
            <div style={{ width: `${pct(summary.scope_3_t_co2e)}%`, background: '#b87a00' }} />
          </div>

          {/* Scope cards */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            {[1, 2, 3].map(s => {
              const val = s === 1 ? summary.scope_1_t_co2e : s === 2 ? summary.scope_2_t_co2e : summary.scope_3_t_co2e
              const labels = ['', 'Direct combustion', 'Purchased electricity', 'Indirect & travel']
              return (
                <div key={s} className="scope-card" style={{ background: scopeBg[s] }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: scopeColour[s], marginBottom: 6 }}>Scope {s} — {labels[s]}</div>
                  <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 24, fontWeight: 800, color: scopeColour[s], lineHeight: 1 }}>{val.toFixed(2)}</div>
                  <div style={{ fontSize: 11, color: scopeColour[s], opacity: .7, marginTop: 3 }}>tCO₂e · {pct(val)}%</div>
                </div>
              )
            })}
          </div>

          {/* Org info */}
          <div className="card">
            <div className="sec-title">Organisation Details</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 24px', fontSize: 13 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #f0f4ee' }}><span style={{ color: '#4a5e46', fontWeight: 600 }}>Company</span><span>{data.organisation_name}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #f0f4ee' }}><span style={{ color: '#4a5e46', fontWeight: 600 }}>Standard</span><span>GHG Protocol Corporate</span></div>
              {intensity?.employees && <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #f0f4ee' }}><span style={{ color: '#4a5e46', fontWeight: 600 }}>Employees</span><span>{intensity.employees.toLocaleString()}</span></div>}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #f0f4ee' }}><span style={{ color: '#4a5e46', fontWeight: 600 }}>Scope 2 method</span><span>Location-based</span></div>
              {intensity?.revenue_m && <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #f0f4ee' }}><span style={{ color: '#4a5e46', fontWeight: 600 }}>Revenue</span><span>£{intensity.revenue_m}m</span></div>}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}><span style={{ color: '#4a5e46', fontWeight: 600 }}>Factors</span><span>DESNZ {data.factor_version}</span></div>
            </div>
          </div>

          {/* Intensity */}
          {intensity && (intensity.per_employee || intensity.per_revenue_m) && (
            <div className="card">
              <div className="sec-title">Intensity Metrics</div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {intensity.per_employee && <div style={{ background: '#f6f8f5', borderRadius: 8, padding: '12px 16px', textAlign: 'center', flex: 1 }}><div style={{ fontFamily: 'Syne,sans-serif', fontSize: 20, fontWeight: 800, color: '#1a7a3c' }}>{intensity.per_employee.toFixed(3)}</div><div style={{ fontSize: 11, color: '#8a9e86', marginTop: 3 }}>tCO₂e per employee</div></div>}
                {intensity.per_revenue_m && <div style={{ background: '#f6f8f5', borderRadius: 8, padding: '12px 16px', textAlign: 'center', flex: 1 }}><div style={{ fontFamily: 'Syne,sans-serif', fontSize: 20, fontWeight: 800, color: '#1a4d8c' }}>{intensity.per_revenue_m.toFixed(3)}</div><div style={{ fontSize: 11, color: '#8a9e86', marginTop: 3 }}>tCO₂e per £m revenue</div></div>}
                {intensity.per_floor_area && <div style={{ background: '#f6f8f5', borderRadius: 8, padding: '12px 16px', textAlign: 'center', flex: 1 }}><div style={{ fontFamily: 'Syne,sans-serif', fontSize: 20, fontWeight: 800, color: '#b87a00' }}>{intensity.per_floor_area.toFixed(4)}</div><div style={{ fontSize: 11, color: '#8a9e86', marginTop: 3 }}>tCO₂e per m²</div></div>}
              </div>
            </div>
          )}

          {/* Activity data */}
          <div className="card">
            <div className="sec-title">Activity Data — {userLines.length} emission sources</div>
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Source</th><th>Scope</th><th style={{ textAlign: 'right' }}>Quantity</th><th>Unit</th><th style={{ textAlign: 'right' }}>tCO₂e</th>
                  </tr>
                </thead>
                <tbody>
                  {userLines.map((l, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#fafcfa' }}>
                      <td>{l.factor.label}</td>
                      <td><span className="badge" style={{ background: scopeBg[l.scope], color: scopeColour[l.scope] }}>S{l.scope}</span></td>
                      <td className="num" style={{ textAlign: 'right' }}>{l.input.quantity.toLocaleString()}</td>
                      <td style={{ color: '#8a9e86' }}>{l.input.unit}</td>
                      <td className="num" style={{ textAlign: 'right', fontWeight: 700, color: scopeColour[l.scope] }}>{l.t_co2e.toFixed(4)}</td>
                    </tr>
                  ))}
                  <tr className="total-row">
                    <td colSpan={4}><strong>Total</strong></td>
                    <td className="num" style={{ textAlign: 'right' }}><strong>{total.toFixed(4)}</strong></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer watermark */}
          <div className="watermark">
            This report was generated by <a href="/">FreshESG</a> · DESNZ {data.factor_version} · GHG Protocol<br />
            Calculated {new Date(result.calculated_at).toLocaleString('en-GB')} · <span style={{ fontFamily: 'monospace', fontSize: 10 }}>{result.id}</span>
          </div>

        </div>
      </body>
    </html>
  )
}
