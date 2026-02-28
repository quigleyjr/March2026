import { NextResponse } from 'next/server'
import { getAllFactors, getFactorMeta } from '@/lib/factors'

export async function GET() {
  return NextResponse.json({ meta: getFactorMeta(), factors: getAllFactors() })
}
