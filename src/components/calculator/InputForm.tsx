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
  { factor_id: 'natural_gas_kwh',        label: 'Natural Gas (kWh)',              unit: 'kWh',    scope: 1, group: 'Scope 1 — Stationary' },
  { factor_id: 'natural_gas_m3',         label: 'Natural Gas (m³)',               unit: 'm3',     scope: 1, group: 'Scope 1 — Stationary' },
  { factor_id: 'natural_gas_therms',     label: 'Natural Gas (therms)',           unit: 'therms', scope: 1, group: 'Scope 1 — Stationary' },
  { factor_id: 'petrol_litres',          label: 'Petrol (litres)',                unit: 'litres', scope: 1, group: 'Scope 1 — Vehicles' },
  { factor_id: 'diesel_litres',          label: 'Diesel (litres)',                unit: 'litres', scope: 1, group: 'Scope 1 — Vehicles' },
  { factor_id: 'petrol_km',             label: 'Petrol Car (km)',                unit: 'km',     scope: 1, group: 'Scope 1 — Vehicles' },
  { factor_id: 'diesel_km',             label: 'Diesel Car (km)',                unit: 'km',     scope: 1, group: 'Scope 1 — Vehicles' },
  { factor_id: 'van_diesel_km',         label: 'Diesel Van (km)',                unit: 'km',     scope: 1, group: 'Scope 1 — Vehicles' },
  { factor_id: 'electricity_kwh',        label: 'Grid Electricity (kWh)',         unit: 'kWh',    scope: 2, group: 'Scope 2 — Electricity' },
  { factor_id: 'flight_domestic',        label: 'Flights — Domestic (km)',        unit: 'km',     scope: 3, group: 'Scope 3 — Business Travel' },
  { factor_id: 'flight_short_haul',      label: 'Flights — Short Haul (km)',      unit: 'km',     scope: 3, group: 'Scope 3 — Business Travel' },
  { factor_id: 'flight_long_haul',       label: 'Flights — Long Haul Economy',   unit: 'km',     scope: 3, group: 'Scope 3 — Business Travel' },
  { factor_id: 'flight_long_haul_business', label: 'Flights — Long Haul Business', unit: 'km',   scope: 3, group: 'Scope 3 — Business Travel' },
  { factor_id: 'rail_national',          label: 'Rail — National UK (km)',        unit: 'km',     scope: 3, group: 'Scope 3 — Business Travel' },
  { factor_id: 'grey_fleet_petrol',      label: 'Grey Fleet — Petrol (km)',       unit: 'km',     scope: 3, group: 'Scope 3 — Business Travel' },
  { factor_id: 'grey_fleet_diesel',      label: 'Grey Fleet — Diesel (km)',       unit: 'km',     scope: 3, group: 'Scope 3 — Business Travel' },
]

const SCOPE_STYLE: Record<number, { bg: string; color: string }> = {
  1: { bg: 'var(--green-light)', color: 'var(--green)' },
  2: { bg: 'var(--blue-light)',  color: 'var(--blue)' },
  3: { bg: 'var(--amber-light)', color: 'var(--amber)' },
}

type Row = ActivityInput & { _key: string }

function emptyRow(n: number): Row {
  const opt = SOURCE_OPTIONS[0]
  return { _key: `row_${Date.now()}_${n}`, id: `input_${n}`, source_type: opt.factor_id, factor_id: opt.factor_id, quantity: 0, unit: opt.unit, period_start: '', period_end: '', estimated: false }
}

const card = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius)',
  padding: '1.25rem',
  boxShadow: 'var(--shadow-sm)',
  marginBottom: '0.75rem',
}

const fieldLabel = {
  display: 'block' as const,
  fontSize: '0.72rem',
  fontWeight: 600,
  color: 'var(--text-2)',
  marginBottom: '0.35rem',
  letterSpacing: '0.01em',
}

const inputBase = {
  width: '100%',
  padding: '0.5rem 0.75rem',
  fontSize: '0.875rem',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-xs)',
  background: 'var(--bg)',
  color: 'var(--text)',
  outline: 'none',
  transition: 'border-color 0.15s',
}

const sectionHead = {
  fontSize: '0.72rem',
  fontWeight: 700,
  color: 'var(--text-3)',
  letterSpacing: '0.06em',
  textTransform: 'uppercase' as const,
  marginBottom: '0.875rem',
}

export function InputForm({ onCalculate, loading }: Props) {
  const [orgName, setOrgName] = useState('')
  const [periodStart, setPeriodStart] = useState('')
  const [periodEnd, setPeriodEnd] = useState('')
  const [rows, setRows] = useState<Row[]>([emptyRow(0)])

  function addRow() { setRows(r => [...r, emptyRow(r.length)]) }
  function removeRow(key: string) { setRows(r => r.filter(row => row._key !== key)) }

  function updateRow(key: string, field: string, value: string | number | boolean) {
    setRows(r => r.map(row => {
      if (row._key !== key) return row
      const updated = { ...row, [field]: value }
      if (field === 'factor_id') {
        const opt = SOURCE_OPTIONS.find(o => o.factor_id === value)
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

  const isValid = orgName.trim() && periodStart && periodEnd && rows.every(r => r.quantity > 0)

  const grouped = SOURCE_OPTIONS.reduce((acc, o) => {
    if (!acc[o.group]) acc[o.group] = []
    acc[o.group].push(o)
    return acc
  }, {} as Record<string, typeof SOURCE_OPTIONS>)

  return (
    <form onSubmit={handleSubmit}>
      {/* Organisation card */}
      <div style={card}>
        <p style={sectionHead}>Organisation</p>
        <div style={{ marginBottom: '0.75rem' }}>
          <label style={fieldLabel}>Company name</label>
          <input type="text" required value={orgName}
            onChange={e => setOrgName(e.target.value)}
            placeholder="e.g. Acme Ltd"
            style={inputBase} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div>
            <label style={fieldLabel}>Period start</label>
            <input type="date" required value={periodStart}
              onChange={e => setPeriodStart(e.target.value)}
              style={inputBase} />
          </div>
          <div>
            <label style={fieldLabel}>Period end</label>
            <input type="date" required value={periodEnd}
              onChange={e => setPeriodEnd(e.target.value)}
              style={inputBase} />
          </div>
        </div>
      </div>

      {/* Activity data card */}
      <div style={card}>
        <p style={sectionHead}>Activity Data</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.75rem' }}>
          {rows.map((row, idx) => {
            const opt = SOURCE_OPTIONS.find(o => o.factor_id === row.factor_id)
            const scopeStyle = SCOPE_STYLE[opt?.scope ?? 1]
            return (
              <div key={row._key} style={{
                background: 'var(--bg)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.75rem',
                display: 'grid',
                gridTemplateColumns: '1fr 110px auto',
                gap: '0.5rem',
                alignItems: 'end',
              }}>
                <div>
                  <label style={{ ...fieldLabel, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span>Source</span>
                    <span style={{
                      fontSize: '0.6rem', fontWeight: 700, padding: '0.15rem 0.5rem',
                      borderRadius: 20, background: scopeStyle.bg, color: scopeStyle.color,
                      letterSpacing: '0.04em',
                    }}>
                      S{opt?.scope}
                    </span>
                  </label>
                  <select value={row.factor_id}
                    onChange={e => updateRow(row._key, 'factor_id', e.target.value)}
                    style={{ ...inputBase, background: 'var(--surface)' }}>
                    {Object.entries(grouped).map(([group, opts]) => (
                      <optgroup key={group} label={group}>
                        {opts.map(o => <option key={o.factor_id} value={o.factor_id}>{o.label}</option>)}
                      </optgroup>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={fieldLabel}>{row.unit}</label>
                  <input type="number" min="0" step="any" required
                    value={row.quantity || ''}
                    onChange={e => updateRow(row._key, 'quantity', parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    style={{ ...inputBase, background: 'var(--surface)' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem', paddingBottom: '2px' }}>
                  <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem', cursor: 'pointer' }}>
                    <span style={{ fontSize: '0.62rem', color: 'var(--text-3)', fontWeight: 600 }}>Est</span>
                    <input type="checkbox" checked={row.estimated ?? false}
                      onChange={e => updateRow(row._key, 'estimated', e.target.checked)}
                      style={{ width: 15, height: 15, cursor: 'pointer' }} />
                  </label>
                  <button type="button" onClick={() => removeRow(row._key)}
                    disabled={rows.length === 1}
                    style={{
                      width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: 'none', border: '1px solid var(--border)', borderRadius: 6,
                      cursor: rows.length === 1 ? 'not-allowed' : 'pointer',
                      color: rows.length === 1 ? 'var(--border)' : 'var(--text-3)',
                      fontSize: '0.8rem', transition: 'all 0.15s',
                    }}>
                    ✕
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        <button type="button" onClick={addRow} style={{
          display: 'flex', alignItems: 'center', gap: '0.4rem',
          fontSize: '0.8rem', fontWeight: 600, color: 'var(--green)',
          background: 'var(--green-light)', border: '1px dashed var(--border-strong)',
          padding: '0.45rem 0.875rem', borderRadius: 'var(--radius-xs)',
          cursor: 'pointer', width: '100%', justifyContent: 'center',
        }}>
          + Add emission source
        </button>
      </div>

      {/* Submit */}
      <button type="submit" disabled={!isValid || loading} style={{
        width: '100%', padding: '0.75rem',
        fontSize: '0.875rem', fontWeight: 700,
        background: isValid && !loading ? 'var(--green)' : 'var(--border-strong)',
        color: isValid && !loading ? 'white' : 'var(--text-3)',
        border: 'none', borderRadius: 'var(--radius-sm)',
        cursor: isValid && !loading ? 'pointer' : 'not-allowed',
        boxShadow: isValid && !loading ? '0 2px 8px rgba(26,122,60,0.25)' : 'none',
        transition: 'all 0.15s',
        letterSpacing: '0.01em',
      }}>
        {loading ? 'Calculating…' : 'Calculate emissions →'}
      </button>
    </form>
  )
}
