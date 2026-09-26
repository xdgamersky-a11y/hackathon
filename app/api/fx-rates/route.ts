import { NextResponse } from 'next/server'
import {
  buildFxRatesToThb,
  fallbackFxResponse,
  getExpectedQuoteCount,
  normalizeFxDate,
  supportedCurrencyQuery,
  type FxRatesResponse,
} from '@/lib/currencies'

export const revalidate = 3_600

export async function GET() {
  try {
    const url = new URL('https://api.frankfurter.dev/v1/latest')
    url.searchParams.set('base', 'THB')
    url.searchParams.set('symbols', supportedCurrencyQuery())

    const response = await fetch(url, { next: { revalidate: 3_600 } })
    if (!response.ok) throw new Error(`Frankfurter returned ${response.status}`)

    const payload: unknown = await response.json()
    if (!payload || typeof payload !== 'object') throw new Error('Invalid exchange-rate response')

    const data = payload as { date?: unknown; base?: unknown; rates?: unknown }
    const date = normalizeFxDate(data.date)
    if (data.base !== 'THB' || !date || !data.rates || typeof data.rates !== 'object') {
      throw new Error('Incomplete exchange-rate response')
    }

    const rows = Object.entries(data.rates as Record<string, unknown>).map(([quote, rate]) => ({
      quote,
      rate: Number(rate),
    }))
    if (rows.length !== getExpectedQuoteCount() || rows.some(({ rate }) => !Number.isFinite(rate) || rate <= 0)) {
      throw new Error('Exchange-rate response did not contain every requested currency')
    }

    const result: FxRatesResponse = {
      date,
      ratesToThb: buildFxRatesToThb(rows),
      source: 'frankfurter',
    }

    return NextResponse.json(result)
  } catch {
    return NextResponse.json(fallbackFxResponse())
  }
}
