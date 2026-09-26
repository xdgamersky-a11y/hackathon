export const currencies = [
  { code: 'THB', symbol: '฿', name: 'Thai Baht', flag: 'TH' },
  { code: 'USD', symbol: '$', name: 'US Dollar', flag: 'US' },
  { code: 'EUR', symbol: '€', name: 'Euro', flag: 'EU' },
  { code: 'GBP', symbol: '£', name: 'British Pound', flag: 'GB' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', flag: 'JP' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', flag: 'CN' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', flag: 'SG' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', flag: 'AU' },
  { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc', flag: 'CH' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', flag: 'CA' },
] as const

export type CurrencyCode = (typeof currencies)[number]['code']
export type FxRatesToThb = Record<CurrencyCode, number>

export const defaultRatesToThb: FxRatesToThb = {
  THB: 1,
  USD: 36,
  EUR: 39,
  GBP: 46,
  JPY: 0.24,
  CNY: 5,
  SGD: 27,
  AUD: 24,
  CHF: 40,
  CAD: 26,
}

export type FxRatesResponse = {
  date: string
  ratesToThb: FxRatesToThb
  source?: 'frankfurter' | 'fallback'
}

export function formatMoney(
  valueInThb: number,
  selectedCurrency: CurrencyCode,
  ratesToThb: FxRatesToThb,
  language: 'en' | 'th' = 'en',
  compact = true,
) {
  const currency = currencies.find(({ code }) => code === selectedCurrency) ?? currencies[0]
  const amount = valueInThb / ratesToThb[selectedCurrency]
  const absoluteAmount = Math.abs(amount)
  const locale = language === 'th' ? 'th-TH' : 'en-US'
  const sign = amount < 0 ? '−' : ''

  if (compact && absoluteAmount >= 1_000_000_000) {
    const formatted = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(amount / 1_000_000_000)
    return `${sign}${currency.symbol}${formatted}bn`
  }

  if (compact && absoluteAmount >= 1_000_000) {
    const formatted = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(amount / 1_000_000)
    return `${sign}${currency.symbol}${formatted}m`
  }

  const formatted = new Intl.NumberFormat(locale, {
    maximumFractionDigits: absoluteAmount < 1_000 && selectedCurrency !== 'JPY' ? 2 : 0,
  }).format(absoluteAmount)

  return `${sign}${currency.symbol}${formatted}`
}

export function toDisplayCurrency(valueInThb: number, selectedCurrency: CurrencyCode, ratesToThb: FxRatesToThb) {
  return valueInThb / ratesToThb[selectedCurrency]
}

export function toThb(valueInSelectedCurrency: number, selectedCurrency: CurrencyCode, ratesToThb: FxRatesToThb) {
  return Math.round(valueInSelectedCurrency * ratesToThb[selectedCurrency])
}

export function currencyUnit(code: CurrencyCode, monthly = false) {
  const currency = currencies.find((item) => item.code === code)!
  return `${currency.symbol}${monthly ? ' / mo' : ''}`
}

export function formatAxisMoney(valueInThb: number, selectedCurrency: CurrencyCode, ratesToThb: FxRatesToThb, language: 'en' | 'th') {
  const amount = valueInThb / ratesToThb[selectedCurrency]
  const absoluteAmount = Math.abs(amount)
  const sign = amount < 0 ? '−' : ''
  const currency = currencies.find(({ code }) => code === selectedCurrency) ?? currencies[0]
  const locale = language === 'th' ? 'th-TH' : 'en-US'

  if (absoluteAmount >= 1_000_000_000) {
    return `${sign}${currency.symbol}${new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(amount / 1_000_000_000)}bn`
  }
  if (absoluteAmount >= 1_000_000) {
    return `${sign}${currency.symbol}${new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(amount / 1_000_000)}m`
  }
  if (absoluteAmount >= 1_000) {
    return `${sign}${currency.symbol}${new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(amount / 1_000)}k`
  }
  return formatMoney(valueInThb, selectedCurrency, ratesToThb, language, false)
}

export function currencyConversionMax(maxThb: number, selectedCurrency: CurrencyCode, ratesToThb: FxRatesToThb) {
  return maxThb / ratesToThb[selectedCurrency]
}

export function currencyConversionStep(stepThb: number, selectedCurrency: CurrencyCode, ratesToThb: FxRatesToThb) {
  return stepThb / ratesToThb[selectedCurrency]
}

export function supportedCurrencies() {
  return currencies.map(({ code }) => code).filter((code): code is Exclude<CurrencyCode, 'THB'> => code !== 'THB')
}

export function isCurrencyCode(value: string): value is CurrencyCode {
  return currencies.some(({ code }) => code === value)
}

export function getCurrencyName(code: CurrencyCode) {
  return currencies.find((currency) => currency.code === code)!.name
}

export function getCurrencySymbol(code: CurrencyCode) {
  return currencies.find((currency) => currency.code === code)!.symbol
}

export function createFallbackFxRates(): FxRatesToThb {
  return { ...defaultRatesToThb }
}

export function isCurrencyCodeRecord(value: unknown): value is FxRatesToThb {
  if (!value || typeof value !== 'object') return false
  const rates = value as Record<string, unknown>
  return currencies.every(({ code }) => typeof rates[code] === 'number' && Number.isFinite(rates[code]) && rates[code] > 0)
}

export function buildFxRatesToThb(rows: Array<{ quote: string; rate: number }>): FxRatesToThb {
  const rates = createFallbackFxRates()
  for (const row of rows) {
    if (isCurrencyCode(row.quote) && row.quote !== 'THB' && Number.isFinite(row.rate) && row.rate > 0) {
      rates[row.quote] = 1 / row.rate
    }
  }
  return rates
}

export function getExpectedQuoteCount() {
  return currencies.length - 1
}

export function toCurrencyRateMap(value: unknown): FxRatesToThb | null {
  return isCurrencyCodeRecord(value) ? value : null
}

export function supportedCurrencyQuery() {
  return supportedCurrencies().join(',')
}

export function normalizeFxDate(value: unknown) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null
}

export function getCurrencyDisplayLabel(code: CurrencyCode) {
  const currency = currencies.find((item) => item.code === code)!
  return `${currency.flag} · ${currency.code} · ${currency.symbol} · ${currency.name}`
}

export function fallbackFxResponse(): FxRatesResponse {
  return { date: '', ratesToThb: createFallbackFxRates(), source: 'fallback' }
}

export function mergeFxRates(response: FxRatesResponse | undefined): FxRatesToThb {
  if (!response || !isCurrencyCodeRecord(response.ratesToThb)) return createFallbackFxRates()
  return response.ratesToThb
}

export function fxRateAsOfLabel(date: string | undefined, language: 'en' | 'th') {
  if (!date) return language === 'th' ? 'ใช้อัตราอ้างอิงสำรอง' : 'Using configured reference rates'
  return language === 'th' ? `อัตราอ้างอิง ณ ${date}` : `Daily reference rates · ${date}`
}

export function getCurrencyLocale(code: CurrencyCode, language: 'en' | 'th') {
  return code === 'THB' && language === 'th' ? 'th-TH' : 'en-US'
}

export function getRateSyncLabel(language: 'en' | 'th') {
  return language === 'th' ? 'อัตราแลกเปลี่ยนหลัก 10 สกุล · ซิงก์แล้ว' : '10 Major FX Rates Syncing... Active'
}

export function currencyInputValue(valueInThb: number, selectedCurrency: CurrencyCode, ratesToThb: FxRatesToThb) {
  const value = toDisplayCurrency(valueInThb, selectedCurrency, ratesToThb)
  return Number(value.toFixed(2))
}

export function getCurrencyConversionRate(selectedCurrency: CurrencyCode, ratesToThb: FxRatesToThb) {
  return ratesToThb[selectedCurrency]
}

export function getCurrencyOptions() {
  return currencies
}

export function getRateDateDescription(date: string | undefined, language: 'en' | 'th') {
  if (!date) return language === 'th' ? 'กำลังโหลดอัตราอ้างอิงรายวัน' : 'Loading daily market reference rates'
  return language === 'th' ? `ข้อมูลอ้างอิงตลาดรายวัน · ${date}` : `Daily market reference rates · ${date}`
}

export function getCurrencyOption(code: CurrencyCode) {
  return currencies.find((currency) => currency.code === code)!
}

export function getCurrencyRateLabel(code: CurrencyCode, ratesToThb: FxRatesToThb, language: 'en' | 'th') {
  const rate = ratesToThb[code]
  const formatted = new Intl.NumberFormat(language === 'th' ? 'th-TH' : 'en-US', { maximumFractionDigits: 4 }).format(rate)
  return `1 ${code} = ${formatted} THB`
}

export function getCurrencyOptionLabel(code: CurrencyCode) {
  const currency = getCurrencyOption(code)
  return `${currency.flag} · ${currency.code} · ${currency.symbol} · ${currency.name}`
}

export function getCurrencyStatusLabel(
  language: 'en' | 'th',
  isLoading: boolean,
  hasError: boolean,
  date?: string,
  source?: FxRatesResponse['source'],
) {
  if (language === 'th') {
    if (hasError || source === 'fallback') return 'ใช้อัตราอ้างอิงสำรอง · ฟีดตลาดไม่พร้อมใช้งาน'
    if (isLoading) return 'กำลังซิงก์อัตราอ้างอิงรายวัน · ใช้อัตราสำรองชั่วคราว'
    return date ? `ซิงก์ล่าสุด ${date}` : 'อัตราอ้างอิงสำรองพร้อมใช้งาน'
  }
  if (hasError || source === 'fallback') return 'Configured reference rates active · live feed unavailable'
  if (isLoading) return 'Syncing daily market rates · configured rates active meanwhile'
  return date ? `Last synced ${date}` : 'Configured reference rates active'
}
