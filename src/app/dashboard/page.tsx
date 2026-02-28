'use client'

import { useState } from 'react'
import type { ActivityInput, CalculationResult } from '@/types'
import { ResultsPanel } from '@/components/calculator/ResultsPanel'
import { InputForm } from '@/components/calculator/InputForm'
import { GapsPanel } from '@/components/calculator/GapsPanel'

export default function DashboardPage() {
  const [result, setResult] = useState<CalculationResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCalculate(data: {
    organisation_name: string
    reporting_period_start: string
    reporting_period_end: string
    inputs: ActivityInput[]
  }) {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, save: true }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Calculation failed')
      setResult(json.result)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen" style={{ background: '#f4f0e8' }}>
      <nav style={{
        borderBottom: '1px solid rgba(45,90,39,0.15)',
        padding: '1rem 2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(244,240,232,0.95)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}>
        <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.25rem', fontWeight: 700, color: '#2d5a27' }}>
          February<span style={{ color: '#d4a843' }}>2026</span>
        </div>
        <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.7rem', color: '#5a7a54', letterSpacing: '0.08em' }}>
          EMISSIONS CALCULATOR · DESNZ 2024
        </div>
      </nav>

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '2.5rem 1.5rem' }}>
        <div style={{ marginBottom: '2.5rem' }}>
          <p style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.7rem', color: '#5a7a54', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            — Scope 1 & 2 Calculator
          </p>
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '2.5rem', fontWeight: 900, color: '#0e1a12', letterSpacing: '-0.02em' }}>
            Calculate your <em style={{ color: '#2d5a27' }}>emissions</em>
          </h1>
          <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#0e1a12', opacity: 0.55, maxWidth: 500 }}>
            Enter activity data below. Uses DESNZ 2024 factors. Every calculation produces a full audit trail for SECR disclosure.
          </p>
        </div>

        <div style={{ display: 'grid', gap: '2rem', gridTemplateColumns: result ? '1fr 1fr' : '1fr' }}>
          <div>
            <InputForm onCalculate={handleCalculate} loading={loading} />
            {error && (
              <div style={{ marginTop: '1rem', padding: '1rem', background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', borderRadius: 4, fontFamily: 'DM Mono, monospace', fontSize: '0.8rem' }}>
                {error}
              </div>
            )}
          </div>
          {result && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <ResultsPanel result={result} />
              {result.gaps.length > 0 && <GapsPanel gaps={result.gaps} />}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
