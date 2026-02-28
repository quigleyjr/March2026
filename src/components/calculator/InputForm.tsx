'use client'

import { useState } from 'react'
import type { ActivityInput } from '@/types'

interface Props {
  onCalculate: (data: {
    organisation_name: string
    reporting_period_start: string
    reporting_period_end: string
    inputs: ActivityInput[]
  }) => void
  loading: boolean
}

const SOURCE_OPTIONS = [
  { factor_id: 'natural_gas_kwh',        label: 'Natural Gas (kWh)',           unit: 'kWh',    scope: 1, group: 'Scope 1 — Stationary' },
  { factor_id: 'natural_gas_m3',         label: 'Natural Gas (m³)',             unit: 'm3',     scope: 1, group: 'Scope 1 — Stationary' },
  { factor_id: 'natural_gas_therms',     label: 'Natural Gas (therms)',         unit: 'therms', scope: 1, group: 'Scope 1 — Stationary' },
  { factor_id: 'petrol_litres',          label: 'Petrol (litres)',              unit: 'litres', scope: 1, group: 'Scope 1 — Vehicles' },
  { factor_id: 'diesel_litres',          label: 'Diesel (litres)',              unit: 'litres', scope: 1, group: 'Scope 1 — Vehicles' },
  { factor_id: 'petrol_km',             label: 'Petrol Car (km)',              unit: 'km',     scope: 1, group: 'Scope 1 — Vehicles' },
  { factor_id: 'diesel_km',             label: 'Diesel Car (km)',              unit: 'km',     scope: 1, group: 'Scope 1 — Vehicles' },
  { factor_id: 'van_diesel_km',         label: 'Diesel Van (km)',              unit: 'km',     scope: 1, group: 'Scope 1 — Vehicles' },
  { factor_id: 'electricity_kwh',        label: 'Grid Electricity (kWh)',       unit: 'kWh',    scope: 2, group: 'Scope 2 — Electricity' },
  { factor_id: 'flight_domestic',        label: 'Flights — Domestic (km)',      unit: 'km',     scope: 3, group: 'Scope 3 — Business Travel' },
  { factor_id: 'flight_short_haul',      label: 'Flights — Short Haul (km)',    unit: 'km',     scope: 3, group: 'Scope 3 — Business Travel' },
  { factor_id: 'flight_long_haul',       label: 'Flights — Long Haul Economy',  unit: 'km',     scope: 3, group: 'Scope 3 — Business Travel' },
  { factor_id: 'flight_long_haul_business', label: 'Flights — Long Haul Business', unit: 'km',  scope: 3, group: 'Scope 3 — Business Travel' },
  { factor_id: 'rail_national',          label: 'Rail — National UK (km)',      unit: 'km',     scope: 3, group: 'Scope 3 — Business Travel' },
  { factor_id: 'grey_fleet_petrol',      label: 'Grey Fleet — Petrol (km)',     unit: 'km',     scope: 3, group: 'Scope 3 — Business Travel' },
  { factor_id: 'grey_fleet_diesel',      label: 'Grey Fleet — Diesel (km)',     unit: 'km',     scope: 3, group: 'Scope 3 — Business Travel' },
]

const SCOPE_BG: Record<number, string> = { 1: '#2d5a27', 2: '#1e4d8c', 3: '#7a5c00' }

type Row = ActivityInput & { _key: string }

function emptyRow(n: number): Row {
  const opt = SOURCE_OPTIONS[0]
  return { _key: `row_${Date.now()}_${n}`, id: `input_${n}`, source_type: opt.factor_id, factor_id: opt.factor_id, quantity: 0, unit: opt.unit, period_start: '', period_end: '', estimated: false }
}

const inputStyle = { width: '100%', padding: '0.4rem 0.6rem', fontSize: '0.875rem', border: '1px solid rgba(45,90,39,0.2)', borderRadius: 3, fontFamily: 'DM Sans, sans-serif', background: 'white', outline: 'none' }
const labelStyle = { display: 'block' as const, fontSize: '0.75rem', color: '#0e1a12', opacity: 0.55, marginBottom: '0.3rem' }
const headingStyle = { fontFamily: 'DM Mono, monospace', fontSize: '0.7rem', color: '#5a7a54', letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginBottom: '1rem' }
const boxStyle = { background: 'white', border: '1px solid rgba(45,90,39,0.15)', borderRadius: 4, padding: '1.5rem', marginBottom: '1rem' }

export function InputForm({ onCalculate, loading }: Props) {
  const [orgName, setOrgName] = useState('')
  const [periodStart, setPeriodStart] = useState('')
  const [periodEnd, setPeriodEnd] = useState('')
  const [rows, setRows] = useState<Row[]>([emptyRow(0)])

  function addRow() { setRows((r) => [...r, emptyRow(r.length)]) }
  function removeRow(key: string) { setRows((r) => r.filter((row) => row._key !== key)) }

  function updateRow(key: string, field: string, value: string | number | boolean) {
    setRows((r) => r.map((row) => {
      if (row._key !== key) return row
      const updated = { ...row, [field]: value }
      if (field === 'factor_id') {
        const opt = SOURCE_OPTIONS.find((o) => o.factor_id === value)
        if (opt) { updated.unit = opt.unit; updated.source_type = String(value) }
      }
      return updated
    }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const inputs: ActivityInput[] = rows.map((r, i) => ({
      id: `input_${i}`, source_type: r.source_type, factor_id: r.factor_id,
      quantity: Number(r.quantity), unit: r.unit,
      period_start: periodStart, period_end: periodEnd,
      site: r.site || undefined, estimated: r.estimated,
    }))
    onCalculate({ organisation_name: orgName, reporting_period_start: periodStart, reporting_period_end: periodEnd, inputs })
  }

  const isValid = orgName.trim() && periodStart && periodEnd && rows.every((r) => r.quantity > 0)

  const grouped = SOURCE_OPTIONS.reduce((acc, o) => {
    if (!acc[o.group]) acc[o.group] = []
    acc[o.group].push(o)
    return acc
  }, {} as Record<string, typeof SOURCE_OPTIONS>)

  return (
    <form onSubmit={handleSubmit}>
      <div style={boxStyle}>
        <p style={headingStyle}>Organisation & Reporting Period</p>
        <div style={{ marginBottom: '0.75rem' }}>
          <label style={labelStyle}>Organisation name *</label>
          <input type="text" required value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder="e.g. Acme Ltd" style={inputStyle} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div>
            <label style={labelStyle}>Period start *</label>
            <input type="date" required value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Period end *</label>
            <input type="date" required value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} style={inputStyle} />
          </div>
        </div>
      </div>

      <div style={boxStyle}>
        <p style={headingStyle}>Activity Data</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.75rem' }}>
          {rows.map((row) => {
            const opt = SOURCE_OPTIONS.find((o) => o.factor_id === row.factor_id)
            return (
              <div key={row._key} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 70px 28px', gap: '0.5rem', alignItems: 'end', background: '#e8ede4', padding: '0.75rem', borderRadius: 3 }}>
                <div>
                  <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    Source
                    <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.6rem', padding: '0.1rem 0.4rem', borderRadius: 2, background: SCOPE_BG[opt?.scope ?? 1], color: 'white' }}>
                      Scope {opt?.scope}
                    </span>
                  </label>
                  <select value={row.factor_id} onChange={(e) => updateRow(row._key, 'factor_id', e.target.value)} style={{ ...inputStyle, background: 'white' }}>
                    {Object.entries(grouped).map(([group, opts]) => (
                      <optgroup key={group} label={group}>
                        {opts.map((o) => <option key={o.factor_id} value={o.factor_id}>{o.label}</option>)}
                      </optgroup>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Qty ({row.unit})</label>
                  <input type="number" min="0" step="any" required value={row.quantity || ''}
                    onChange={(e) => updateRow(row._key, 'quantity', parseFloat(e.target.value) || 0)}
                    placeholder="0" style={inputStyle} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                  <label style={{ ...labelStyle, marginBottom: 0 }}>Est.</label>
                  <input type="checkbox" checked={row.estimated ?? false} onChange={(e) => updateRow(row._key, 'estimated', e.target.checked)} />
                </div>
                <button type="button" onClick={() => removeRow(row._key)} disabled={rows.length === 1}
                  style={{ padding: '0.25rem', background: 'none', border: 'none', cursor: rows.length === 1 ? 'not-allowed' : 'pointer', color: rows.length === 1 ? '#ccc' : '#c45c2a', fontSize: '1rem' }}>
                  ✕
                </button>
              </div>
            )
          })}
        </div>
        <button type="button" onClick={addRow}
          style={{ fontSize: '0.85rem', color: '#2d5a27', background: 'none', border: '1px solid #7aad6e', padding: '0.4rem 0.8rem', borderRadius: 3, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
          + Add source
        </button>
      </div>

      <button type="submit" disabled={!isValid || loading}
        style={{ width: '100%', padding: '0.85rem', fontSize: '0.9rem', fontWeight: 500, background: isValid && !loading ? '#2d5a27' : 'rgba(45,90,39,0.3)', color: '#f4f0e8', border: 'none', borderRadius: 3, cursor: isValid && !loading ? 'pointer' : 'not-allowed', fontFamily: 'DM Sans, sans-serif' }}>
        {loading ? 'Calculating…' : 'Calculate emissions'}
      </button>
    </form>
  )
}
