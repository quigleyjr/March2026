import factors2024 from './desnz-2024.json'
import factors2025 from './desnz-2025.json'
import type { EmissionFactor } from '@/types'

type FactorDB = {
  _meta: {
    version: string
    source: string
    publisher: string
    status?: string
    status_note?: string
    effective_from: string
    url: string
  }
  factors: Record<string, EmissionFactor>
}

const DB: Record<string, FactorDB> = {
  '2024': factors2024 as unknown as FactorDB,
  '2025': factors2025 as unknown as FactorDB,
}

export const FACTOR_VERSIONS = [
  { value: '2024', label: 'DESNZ 2024 (current official)', status: 'official' as const },
  { value: '2025', label: 'DESNZ 2025 (provisional — official due June 2026)', status: 'provisional' as const },
]

export const DEFAULT_VERSION = '2024'

function getDB(version = DEFAULT_VERSION): FactorDB {
  return DB[version] ?? DB[DEFAULT_VERSION]
}

export function getFactorVersion(version?: string): string {
  return getDB(version)._meta.version
}

export function getFactorMeta(version?: string) {
  return getDB(version)._meta
}

export function getFactor(id: string, version?: string): EmissionFactor {
  const db = getDB(version)
  const factor = db.factors[id]
  if (!factor) throw new Error(`Unknown factor id: "${id}" in DESNZ ${version ?? DEFAULT_VERSION}`)
  return factor
}

export function getAllFactors(version?: string): EmissionFactor[] {
  return Object.values(getDB(version).factors)
}

export function isProvisional(version?: string): boolean {
  return getDB(version)._meta.status === 'provisional'
}
