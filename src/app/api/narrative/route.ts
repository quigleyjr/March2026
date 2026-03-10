import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import type { CalculationResult } from '@/types'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const { result }: { result: CalculationResult } = await req.json()

    const hasScope3   = result.summary.scope_3_t_co2e > 0
    const hasEstimates = result.summary.estimated_lines > 0
    const periodStart  = new Date(result.reporting_period_start).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    const periodEnd    = new Date(result.reporting_period_end).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

    const prompt = `You are a senior carbon accountant writing the energy and carbon section for a UK company's statutory annual report. The text will appear verbatim in the Directors' Report under the SECR (Streamlined Energy and Carbon Reporting) regulations.

Write EXACTLY four paragraphs separated by blank lines. No headers, no bullet points, no markdown, no bold text. Plain prose only.

Paragraph 1 — Emissions summary:
State the company name, reporting period (${periodStart} to ${periodEnd}), and total GHG emissions of ${result.summary.total_t_co2e} tCO2e. Break this down into Scope 1 direct emissions of ${result.summary.scope_1_t_co2e} tCO2e (combustion of fuels and operation of facilities) and Scope 2 indirect emissions of ${result.summary.scope_2_t_co2e} tCO2e from purchased electricity, calculated using the location-based method.${hasScope3 ? ` Also state that Scope 3 indirect emissions total ${result.summary.scope_3_t_co2e} tCO2e, covering well-to-tank fuel chain emissions and business travel activities.` : ''}

Paragraph 2 — Methodology:
Explain that the company has applied the Greenhouse Gas Protocol Corporate Accounting and Reporting Standard. State that conversion factors are sourced from the UK Government Department for Energy Security and Net Zero (DESNZ) GHG Conversion Factors ${result.factor_version}. Note the operational control consolidation approach — the company includes all operations over which it has authority to introduce and implement operating policies.

Paragraph 3 — Data quality and sources:
Describe the data collection process. State that activity data has been compiled from primary sources including fuel purchase invoices, electricity supplier bills, and business travel records. ${hasEstimates ? `Note that ${result.summary.estimated_lines} emission source(s) required estimation using industry-standard proxies where primary metered data was unavailable.` : 'Confirm that all emission sources are based on metered or invoiced primary data with no estimated figures required.'} The data quality score for this calculation is ${result.summary.data_quality_score} out of 100.

Paragraph 4 — Compliance statement:
Confirm that this disclosure is made in compliance with the Companies Act 2006 (Strategic Report and Directors' Report) Regulations 2013, as amended by the Companies (Directors' Report) and Limited Liability Partnerships (Energy and Carbon Report) Regulations 2018. State that the company continues to review its energy use and implement measures to improve efficiency and reduce its carbon footprint.

Rules:
- Formal, authoritative language appropriate for a statutory annual report
- Third person throughout
- No first-person pronouns
- No markdown formatting of any kind — no asterisks, no hashes, no dashes
- Exactly four paragraphs, blank line between each
- Do not invent figures not provided above`

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 600,
      messages: [{ role: 'user', content: prompt }],
    })

    const narrative = message.content[0].type === 'text' ? message.content[0].text.trim() : ''
    return NextResponse.json({ narrative })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to generate narrative'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
