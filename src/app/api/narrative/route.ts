import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import type { CalculationResult } from '@/types'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const { result }: { result: CalculationResult } = await req.json()

    const prompt = `You are an expert carbon accountant writing a SECR (Streamlined Energy and Carbon Reporting) narrative for a UK company's annual report.

Write a concise, professional SECR narrative section based on the following emissions data. The narrative should:
- State the total emissions in tCO2e for the reporting period
- Break down Scope 1 and Scope 2 emissions
- Mention the methodology used (GHG Protocol, DESNZ conversion factors)
- Note the consolidation approach (operational control)
- Include a brief statement on data quality
- Be written in formal third-person business language suitable for a UK annual report
- Be approximately 150-200 words
- NOT include section headers, just flowing prose

Emissions Data:
- Organisation: ${result.organisation_name}
- Reporting Period: ${result.reporting_period_start} to ${result.reporting_period_end}
- Total emissions: ${result.summary.total_t_co2e} tCO2e
- Scope 1 (direct): ${result.summary.scope_1_t_co2e} tCO2e
- Scope 2 (electricity, location-based): ${result.summary.scope_2_t_co2e} tCO2e
- Scope 3 (well-to-tank upstream): ${result.summary.scope_3_t_co2e} tCO2e
- Data quality score: ${result.summary.data_quality_score}/100
- Estimated lines: ${result.summary.estimated_lines}
- Conversion factors: DESNZ UK Government GHG Conversion Factors ${result.factor_version}
- Calculation ID: ${result.id}

Write the SECR narrative now:`

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }],
    })

    const narrative = message.content[0].type === 'text' ? message.content[0].text : ''

    return NextResponse.json({ narrative })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to generate narrative'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
