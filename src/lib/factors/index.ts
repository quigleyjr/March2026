import factorData from './desnz-2024.json'
import type { EmissionFactor } from '@/types'

const db = factorData as { _meta: { version: string; source: string; publisher: string; effective_from: string; url: string }; factors: Record<string, EmissionFactor> }

export function getFactorVersion(): string {
  return db._meta.version
}

export function getFactorMeta() {
  return db._meta
}

export function getFactor(id: string): EmissionFactor {
  const factor = db.factors[id]
  if (!factor) throw new Error(`Unknown factor id: "${id}"`)
  return factor
}

export function getAllFactors(): EmissionFactor[] {
  return Object.values(db.factors)
}
