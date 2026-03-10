'use client'

import { useEffect, useState } from 'react'
import type { ActivityInput, OrgProfile } from '@/types'
import { FACTOR_VERSIONS } from '@/lib/factors'

type TemplateInput = {
  factor_id: string
  source_type: string
  quantity: number
  unit: string
  site?: string
  estimated?: boolean
}

type Template = {
  organisation_name: string
  inputs: TemplateInput[]
} | null

interface Props {
  onCalculate: (data: {
    organisation_name: string
    reporting_period_start: string
    reporting_period_end: string
    inputs: ActivityInput[]
    factor_version_year?: string
  }) => void
  loading: boolean
  profile?: OrgProfile | null
  template?: Template
  factorVersionYear?: string
  onVersionChange?: (v: string) => void
}

const SOURCE_OPTIONS = [
  { factor_id: 'natural_gas_kwh',           label: 'Natural Gas (kWh)',              unit: 'kWh',    scope: 1, group: 'Scope 1 — Stationary' },
  { factor_id: 'natural_gas_m3',            label: 'Natural Gas (m³)',               unit: 'm3',     scope: 1, group: 'Scope 1 — Stationary' },
  { factor_id: 'natural_gas_therms',        label: 'Natural Gas (therms)',           unit: 'therms', scope: 1, group: 'Scope 1 — Stationary' },
  { factor_id: 'petrol_litres',             label: 'Petrol (litres)',                unit: 'litres', scope: 1, group: 'Scope 1 — Vehicles' },
  { factor_id: 'diesel_litres',             label: 'Diesel (litres)',                unit: 'litres', scope: 1, group: 'Scope 1 — Vehicles' },
  { factor_id: 'petrol_km',                 label: 'Petrol Car (km)',                unit: 'km',     scope: 1, group: 'Scope 1 — Vehicles' },
  { factor_id: 'diesel_km',                 label: 'Diesel Car (km)',                unit: 'km',     scope: 1, group: 'Scope 1 — Vehicles' },
  { factor_id: 'van_diesel_km',             label: 'Diesel Van (km)',                unit: 'km',     scope: 1, group: 'Scope 1 — Vehicles' },
  { factor_id: 'electricity_kwh',           label: 'Grid Electricity (kWh)',         unit: 'kWh',    scope: 2, group: 'Scope 2 — Electricity' },
  { factor_id: 'flight_domestic',           label: 'Flights — Domestic (km)',        unit: 'km',     scope: 3, group: 'Scope 3 — Business Travel' },
  { factor_id: 'flight_short_haul',         label: 'Flights — Short Haul (km)',      unit: 'km',     scope: 3, group: 'Scope 3 — Business Travel' },
  { factor_id: 'flight_long_haul',          label: 'Flights — Long Haul Economy',   unit: 'km',     scope: 3, group: 'Scope 3 — Business Travel' },
  { factor_id: 'flight_long_haul_business', label: 'Flights — Long Haul Business',  unit: 'km',     scope: 3, group: 'Scope 3 — Business Travel' },
  { factor_id: 'rail_national',             label: 'Rail — National UK (km)',        unit: 'km',     scope: 3, group: 'Scope 3 — Business Travel' },
  { factor_id: 'grey_fleet_petrol',         label: 'Grey Fleet — Petrol (km)',       unit: 'km',     scope: 3, group: 'Scope 3 — Business Travel' },
  { factor_id: 'grey_fleet_diesel',         label: 'Grey Fleet — Diesel (km)',       unit: 'km',     scope: 3, group: 'Scope 3 — Business Travel' },
  { factor_id: 'cat1_food_drink',            label: 'Food & Drink (£ spend)',            unit: 'GBP', scope: 3, group: 'Scope 3 Cat 1 — Purchased Goods & Services' },
  { factor_id: 'cat1_paper_packaging',       label: 'Paper & Packaging (£ spend)',       unit: 'GBP', scope: 3, group: 'Scope 3 Cat 1 — Purchased Goods & Services' },
  { factor_id: 'cat1_it_equipment',          label: 'IT Equipment (£ spend)',            unit: 'GBP', scope: 3, group: 'Scope 3 Cat 1 — Purchased Goods & Services' },
  { factor_id: 'cat1_machinery',             label: 'Machinery & Equipment (£ spend)',   unit: 'GBP', scope: 3, group: 'Scope 3 Cat 1 — Purchased Goods & Services' },
  { factor_id: 'cat1_chemicals',             label: 'Chemicals (£ spend)',               unit: 'GBP', scope: 3, group: 'Scope 3 Cat 1 — Purchased Goods & Services' },
  { factor_id: 'cat1_construction_materials',label: 'Construction Materials (£ spend)',  unit: 'GBP', scope: 3, group: 'Scope 3 Cat 1 — Purchased Goods & Services' },
  { factor_id: 'cat1_textiles',              label: 'Textiles & Clothing (£ spend)',     unit: 'GBP', scope: 3, group: 'Scope 3 Cat 1 — Purchased Goods & Services' },
  { factor_id: 'cat1_professional_services', label: 'Professional Services (£ spend)',   unit: 'GBP', scope: 3, group: 'Scope 3 Cat 1 — Purchased Goods & Services' },
  { factor_id: 'cat1_cleaning_services',     label: 'Cleaning & Facilities (£ spend)',   unit: 'GBP', scope: 3, group: 'Scope 3 Cat 1 — Purchased Goods & Services' },
  { factor_id: 'cat1_catering',              label: 'Catering (£ spend)',                unit: 'GBP', scope: 3, group: 'Scope 3 Cat 1 — Purchased Goods & Services' },
  { factor_id: 'cat1_average_spend',         label: 'Average — All Sectors (£ spend)',   unit: 'GBP', scope: 3, group: 'Scope 3 Cat 1 — Purchased Goods & Services' },
]

const SCOPE_STYLE: Record<number, { bg: string; color: string }> = {
  1: { bg: 'var(--green-light)', color: 'var(--green)' },
  2: { bg: 'var(--blue-light)',  color: 'var(--blue)'  },
  3: { bg: 'var(--amber-light)', color: 'var(--amber)' },
}

type Row = {
  _key: string
  factor_id: string
  source_type: string
  quantity: number
  unit: string
  site: string
  estimated: boolean
}

function defaultRow(): Row {
  return { _key: `r_${Date.now()}_${Math.random()}`, factor_id: 'natural_gas_kwh', source_type: 'natural_gas_kwh', quantity: 0, unit: 'kWh', site: '', estimated: false }
}

function rowFromTemplate(inp: TemplateInput, i: number): Row {
  return { _key: `r_t${i}_${Date.now()}`, factor_id: inp.factor_id, source_type: inp.source_type, quantity: inp.quantity, unit: inp.unit, site: inp.site || '', estimated: inp.estimated ?? false }
}

export function InputForm({ onCalculate, loading, profile, template, factorVersionYear = '2024', onVersionChange }: Props) {
  const [orgName,      setOrgName]      = useState(template?.organisation_name || profile?.name || '')
  const [periodStart,  setPeriodStart]  = useState('')
  const [periodEnd,    setPeriodEnd]    = useState('')
  const [rows,         setRows]         = useState<Row[]>(
    template?.inputs?.length ? template.inputs.map(rowFromTemplate) : [defaultRow()]
  )

  useEffect(() => {
    if (!template && profile?.name) setOrgName(profile.name)
  }, [profile?.name, template])

  const sites = profile?.sites?.filter(Boolean) ?? []

  const grouped = SOURCE_OPTIONS.reduce((acc, o) => {
    acc[o.group] = acc[o.group] ?? []
    acc[o.group].push(o)
    return acc
  }, {} as Record<string, typeof SOURCE_OPTIONS>)

  function addRow() { setRows(r => [...r, defaultRow()]) }
  function removeRow(key: string) { if (rows.length > 1) setRows(r => r.filter(x => x._key !== key)) }

  function updateRow(key: string, field: keyof Row, value: string | number | boolean) {
    setRows(prev => prev.map(row => {
      if (row._key !== key) return row
      const next = { ...row, [field]: value }
      if (field === 'factor_id') {
        const opt = SOURCE_OPTIONS.find(o => o.factor_id === value)
        if (opt) { next.unit = opt.unit; next.source_type = opt.factor_id }
      }
      return next
    }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onCalculate({
      organisation_name: orgName,
      reporting_period_start: periodStart,
      reporting_period_end: periodEnd,
      factor_version_year: factorVersionYear,
      inputs: rows.map((r, i) => ({
        id: `input_${i}`,
        source_type: r.source_type,
        factor_id: r.factor_id,
        quantity: r.quantity,
        unit: r.unit,
        period_start: periodStart,
        period_end: periodEnd,
        site: r.site || undefined,
        estimated: r.estimated,
      })),
    })
  }

  const isValid = orgName.trim() && periodStart && periodEnd && rows.every(r => r.quantity > 0)

  const card:    React.CSSProperties = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1.25rem', boxShadow: 'var(--shadow-sm)', marginBottom: '0.75rem' }
  const lbl:     React.CSSProperties = { display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-2)', marginBottom: '0.35rem' }
  const inp:     React.CSSProperties = { width: '100%', padding: '0.5rem 0.75rem', fontSize: '0.875rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-xs)', background: 'var(--bg)', color: 'var(--text)', outline: 'none', fontFamily: 'inherit' }
  const secHead: React.CSSProperties = { fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-3)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.875rem' }

  return (
    <form onSubmit={handleSubmit}>
      <div style={card}>
        <p style={secHead}>Organisation</p>
        <div style={{ marginBottom: '0.75rem' }}>
          <label style={lbl}>Company name</label>
          <input style={inp} type="text" required value={orgName} onChange={e => setOrgName(e.target.value)} placeholder="e.g. Acme Ltd" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div>
            <label style={lbl}>Period start</label>
            <input style={inp} type="date" required value={periodStart} onChange={e => setPeriodStart(e.target.value)} />
          </div>
          <div>
            <label style={lbl}>Period end</label>
            <input style={inp} type="date" required value={periodEnd} onChange={e => setPeriodEnd(e.target.value)} />
          </div>
        </div>

        <div style={{ marginTop: '0.75rem' }}>
          <label style={lbl}>Emission factors version</label>
          <select style={{ ...inp, background: 'var(--surface)' }}
            value={factorVersionYear}
            onChange={e => onVersionChange?.(e.target.value)}>
            {FACTOR_VERSIONS.map(v => (
              <option key={v.value} value={v.value}>{v.label}</option>
            ))}
          </select>
          {factorVersionYear === '2025' && (
            <div style={{ marginTop: '0.4rem', padding: '0.4rem 0.6rem', background: 'var(--amber-light)', borderRadius: 'var(--radius-xs)', fontSize: '0.72rem', color: 'var(--amber)', fontWeight: 600 }}>
              ⚠ DESNZ 2025 factors are provisional. Official values due June 2026. Do not use for final statutory disclosure.
            </div>
          )}
        </div>
      </div>

      <div style={card}>
        <p style={secHead}>
          Activity Data
          {template && (
            <span style={{ marginLeft: '0.5rem', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6rem', padding: '0.15rem 0.5rem', background: 'var(--blue-light)', color: 'var(--blue)', borderRadius: 20, fontWeight: 400, textTransform: 'none' }}>
              {rows.length} sources loaded
            </span>
          )}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.75rem' }}>
          {rows.map(row => {
            const opt = SOURCE_OPTIONS.find(o => o.factor_id === row.factor_id) ?? SOURCE_OPTIONS[0]
            const ss  = SCOPE_STYLE[opt.scope]
            const cols = sites.length > 0 ? '1.5fr 1fr 110px auto' : '2fr 110px auto'
            return (
              <div key={row._key} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '0.75rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: cols, gap: '0.5rem', alignItems: 'end' }}>
                  <div>
                    <label style={{ ...lbl, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      Source
                      <span style={{ fontSize: '0.6rem', fontWeight: 700, padding: '0.15rem 0.45rem', borderRadius: 20, background: ss.bg, color: ss.color }}>S{opt.scope}</span>
                    </label>
                    <select style={{ ...inp, background: 'var(--surface)' }} value={row.factor_id} onChange={e => updateRow(row._key, 'factor_id', e.target.value)}>
                      {Object.entries(grouped).map(([grp, opts]) => (
                        <optgroup key={grp} label={grp}>
                          {opts.map(o => <option key={o.factor_id} value={o.factor_id}>{o.label}</option>)}
                        </optgroup>
                      ))}
                    </select>
                  </div>

                  {sites.length > 0 && (
                    <div>
                      <label style={lbl}>Site</label>
                      <select style={{ ...inp, background: 'var(--surface)' }} value={row.site} onChange={e => updateRow(row._key, 'site', e.target.value)}>
                        <option value="">— All sites</option>
                        {sites.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  )}

                  <div>
                    <label style={lbl}>{row.unit}</label>
                    <input style={{ ...inp, background: 'var(--surface)' }} type="number" min="0" step="any" required
                      value={row.quantity || ''}
                      onChange={e => updateRow(row._key, 'quantity', parseFloat(e.target.value) || 0)}
                      placeholder="0" />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.4rem', paddingBottom: '1px' }}>
                    <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem', cursor: 'pointer' }}>
                      <span style={{ fontSize: '0.62rem', color: 'var(--text-3)', fontWeight: 600 }}>Est</span>
                      <input type="checkbox" checked={row.estimated} onChange={e => updateRow(row._key, 'estimated', e.target.checked)} style={{ width: 15, height: 15 }} />
                    </label>
                    <button type="button" onClick={() => removeRow(row._key)} disabled={rows.length === 1}
                      style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: '1px solid var(--border)', borderRadius: 6, cursor: rows.length === 1 ? 'not-allowed' : 'pointer', color: rows.length === 1 ? 'var(--border)' : 'var(--text-3)', fontSize: '0.8rem' }}>
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <button type="button" onClick={addRow}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--green)', background: 'var(--green-light)', border: '1px dashed var(--border-strong)', padding: '0.45rem 0.875rem', borderRadius: 'var(--radius-xs)', cursor: 'pointer', width: '100%', justifyContent: 'center' }}>
          + Add emission source
        </button>
      </div>

      <button type="submit" disabled={!isValid || loading}
        style={{ width: '100%', padding: '0.75rem', fontSize: '0.875rem', fontWeight: 700, background: isValid && !loading ? 'var(--green)' : 'var(--border-strong)', color: isValid && !loading ? 'white' : 'var(--text-3)', border: 'none', borderRadius: 'var(--radius-sm)', cursor: isValid && !loading ? 'pointer' : 'not-allowed', boxShadow: isValid && !loading ? '0 2px 8px rgba(26,122,60,0.25)' : 'none', transition: 'all 0.15s' }}>
        {loading ? 'Calculating…' : 'Calculate emissions →'}
      </button>
    </form>
  )
}
