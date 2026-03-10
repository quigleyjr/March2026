'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'

type ImportResult = {
  organisation_name: string
  period_start: string
  period_end: string
  total_t_co2e: number
  lines: number
  id: string
}

type ImportError = {
  organisation_name: string
  period_start: string
  error: string
}

type ImportResponse = {
  success: boolean
  total_rows: number
  total_groups: number
  imported: number
  failed: number
  results: ImportResult[]
  errors: ImportError[]
}

type Stage = 'idle' | 'uploading' | 'done' | 'error'

export default function ImportPage() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [stage, setStage] = useState<Stage>('idle')
  const [dragging, setDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [progress, setProgress] = useState(0)
  const [response, setResponse] = useState<ImportResponse | null>(null)
  const [errorMsg, setErrorMsg] = useState('')

  const handleFile = useCallback((f: File) => {
    if (!f.name.endsWith('.csv')) {
      setErrorMsg('Please upload a CSV file. Export the "API Upload Format" sheet from the Excel file as CSV.')
      setStage('error')
      return
    }
    setFile(f)
    setStage('idle')
    setErrorMsg('')
  }, [])

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }

  async function runImport() {
    if (!file) return
    setStage('uploading')
    setProgress(0)
    setResponse(null)

    // Simulate progress animation while waiting
    const ticker = setInterval(() => {
      setProgress(p => p < 88 ? p + Math.random() * 6 : p)
    }, 400)

    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/import', { method: 'POST', body: fd })
      clearInterval(ticker)
      setProgress(100)

      const data = await res.json()
      if (!res.ok) {
        setErrorMsg(data.error || 'Import failed')
        setStage('error')
        return
      }
      setResponse(data)
      setStage('done')
    } catch (err) {
      clearInterval(ticker)
      setErrorMsg(err instanceof Error ? err.message : 'Network error')
      setStage('error')
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--font-body)' }}>
      {/* Nav */}
      <nav style={{ background: '#fff', borderBottom: '1px solid var(--border)', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, color: 'var(--green)' }}>March0603</span>
          <div style={{ display: 'flex', gap: 4 }}>
            {[['/', 'Home'], ['/dashboard', 'Calculator'], ['/history', 'History'], ['/import', 'Bulk Import']].map(([href, label]) => (
              <a key={href} href={href} style={{
                padding: '4px 12px', borderRadius: 6, fontSize: 13, fontWeight: 500, textDecoration: 'none',
                background: href === '/import' ? 'var(--green-light)' : 'transparent',
                color: href === '/import' ? 'var(--green)' : 'var(--text-2)',
              }}>{label}</a>
            ))}
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: 820, margin: '0 auto', padding: '40px 24px' }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: 'var(--text)', marginBottom: 6 }}>
            Bulk Import
          </h1>
          <p style={{ color: 'var(--text-2)', fontSize: 14 }}>
            Upload a CSV file to calculate and save emissions data for multiple companies at once.
            Each company + reporting period becomes a separate calculation in your history.
          </p>
        </div>

        {/* Instructions */}
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 12, padding: 20, marginBottom: 24 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)', marginBottom: 12 }}>Required CSV columns</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              ['organisation_name', 'Company name', true],
              ['reporting_period_start', 'YYYY-MM-DD', true],
              ['reporting_period_end', 'YYYY-MM-DD', true],
              ['factor_id', 'e.g. natural_gas_kwh', true],
              ['quantity', 'Numeric amount', true],
              ['unit', 'e.g. kWh, litres, km', true],
              ['site', 'Site label (optional)', false],
              ['estimated', 'Yes / No (optional)', false],
              ['employees', 'For intensity metrics', false],
              ['revenue_m', 'Revenue in £m', false],
              ['floor_area_m2', 'Floor area m²', false],
            ].map(([col, desc, req]) => (
              <div key={col as string} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: 'var(--bg)', borderRadius: 6 }}>
                <code style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--green)', background: 'var(--green-light)', padding: '1px 6px', borderRadius: 4 }}>{col}</code>
                <span style={{ fontSize: 12, color: 'var(--text-2)', flex: 1 }}>{desc}</span>
                {req ? <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--green)', background: 'var(--green-light)', padding: '1px 6px', borderRadius: 9 }}>required</span>
                      : <span style={{ fontSize: 10, color: 'var(--text-3)' }}>optional</span>}
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12, padding: 10, background: 'var(--blue-light)', borderRadius: 8, fontSize: 12, color: 'var(--blue)' }}>
            💡 Export the <strong>API Upload Format</strong> sheet from the test data Excel file as CSV — it&apos;s already in the correct format.
          </div>
        </div>

        {/* Drop zone */}
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => fileRef.current?.click()}
          style={{
            border: `2px dashed ${dragging ? 'var(--green)' : file ? 'var(--green)' : 'var(--border-strong)'}`,
            borderRadius: 12,
            padding: '40px 24px',
            textAlign: 'center',
            cursor: 'pointer',
            background: dragging ? 'var(--green-light)' : file ? '#f0faf3' : '#fff',
            transition: 'all 0.15s ease',
            marginBottom: 16,
          }}
        >
          <input ref={fileRef} type="file" accept=".csv" style={{ display: 'none' }}
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
          <div style={{ fontSize: 32, marginBottom: 10 }}>{file ? '✅' : '📂'}</div>
          {file ? (
            <>
              <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--green)', marginBottom: 4 }}>{file.name}</div>
              <div style={{ fontSize: 13, color: 'var(--text-2)' }}>{(file.size / 1024).toFixed(1)} KB · Click to change</div>
            </>
          ) : (
            <>
              <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)', marginBottom: 4 }}>Drop CSV file here</div>
              <div style={{ fontSize: 13, color: 'var(--text-3)' }}>or click to browse</div>
            </>
          )}
        </div>

        {/* Error */}
        {stage === 'error' && (
          <div style={{ padding: '12px 16px', background: 'var(--red-light)', border: '1px solid #f5c6c6', borderRadius: 8, color: 'var(--red)', fontSize: 13, marginBottom: 16 }}>
            ⚠️ {errorMsg}
          </div>
        )}

        {/* Upload button */}
        {stage !== 'done' && (
          <button
            disabled={!file || stage === 'uploading'}
            onClick={runImport}
            style={{
              width: '100%', padding: '14px', background: !file || stage === 'uploading' ? 'var(--border)' : 'var(--green)',
              color: !file || stage === 'uploading' ? 'var(--text-3)' : '#fff',
              border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: !file || stage === 'uploading' ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {stage === 'uploading' ? 'Processing…' : '↑ Run Import'}
          </button>
        )}

        {/* Progress bar */}
        {stage === 'uploading' && (
          <div style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-2)', marginBottom: 6 }}>
              <span>Calculating emissions for all companies…</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div style={{ height: 8, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progress}%`, background: 'var(--green)', borderRadius: 4, transition: 'width 0.4s ease' }} />
            </div>
          </div>
        )}

        {/* Results */}
        {stage === 'done' && response && (
          <div style={{ marginTop: 24 }}>
            {/* Summary cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, marginBottom: 24 }}>
              {[
                { label: 'Rows parsed', value: response.total_rows.toLocaleString(), color: 'var(--text)' },
                { label: 'Calculations', value: response.total_groups.toLocaleString(), color: 'var(--blue)' },
                { label: 'Imported', value: response.imported.toLocaleString(), color: 'var(--green)' },
                { label: 'Failed', value: response.failed.toLocaleString(), color: response.failed > 0 ? 'var(--red)' : 'var(--text-3)' },
              ].map(c => (
                <div key={c.label} style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 10, padding: '16px', textAlign: 'center' }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: c.color, fontFamily: 'var(--font-display)' }}>{c.value}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 4 }}>{c.label}</div>
                </div>
              ))}
            </div>

            {/* Imported list */}
            {response.results.length > 0 && (
              <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', marginBottom: 16 }}>
                <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>✅ Imported calculations</span>
                  <button onClick={() => router.push('/history')} style={{ padding: '6px 14px', background: 'var(--green)', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                    View in History →
                  </button>
                </div>
                <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: 'var(--bg)' }}>
                        <th style={{ textAlign: 'left', padding: '10px 16px', color: 'var(--text-2)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.05em' }}>Company</th>
                        <th style={{ textAlign: 'left', padding: '10px 16px', color: 'var(--text-2)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.05em' }}>Period</th>
                        <th style={{ textAlign: 'right', padding: '10px 16px', color: 'var(--text-2)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.05em' }}>Lines</th>
                        <th style={{ textAlign: 'right', padding: '10px 16px', color: 'var(--text-2)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.05em' }}>tCO₂e</th>
                      </tr>
                    </thead>
                    <tbody>
                      {response.results.map((r, i) => (
                        <tr key={r.id} style={{ borderTop: '1px solid var(--border)', background: i % 2 === 0 ? '#fff' : 'var(--bg)' }}>
                          <td style={{ padding: '9px 16px', fontWeight: 600 }}>{r.organisation_name}</td>
                          <td style={{ padding: '9px 16px', color: 'var(--text-2)' }}>{r.period_start} → {r.period_end}</td>
                          <td style={{ padding: '9px 16px', textAlign: 'right', color: 'var(--text-2)' }}>{r.lines}</td>
                          <td style={{ padding: '9px 16px', textAlign: 'right', fontWeight: 700, color: 'var(--green)', fontFamily: 'var(--font-mono)' }}>{r.total_t_co2e.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Errors */}
            {response.errors.length > 0 && (
              <div style={{ background: '#fff', border: '1px solid #f5c6c6', borderRadius: 12, overflow: 'hidden', marginBottom: 16 }}>
                <div style={{ padding: '14px 20px', borderBottom: '1px solid #f5c6c6', background: 'var(--red-light)' }}>
                  <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--red)' }}>⚠️ {response.errors.length} failed</span>
                </div>
                {response.errors.map((e, i) => (
                  <div key={i} style={{ padding: '10px 16px', borderTop: i > 0 ? '1px solid #fdeaea' : 'none', fontSize: 13 }}>
                    <span style={{ fontWeight: 600 }}>{e.organisation_name}</span>
                    <span style={{ color: 'var(--text-2)', margin: '0 8px' }}>({e.period_start})</span>
                    <span style={{ color: 'var(--red)' }}>{e.error}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Import another */}
            <button onClick={() => { setStage('idle'); setFile(null); setResponse(null) }}
              style={{ padding: '10px 20px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', fontSize: 13, color: 'var(--text-2)', fontWeight: 600 }}>
              ← Import another file
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
