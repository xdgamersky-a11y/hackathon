'use client'

import { useMemo, useState } from 'react'
import useSWR from 'swr'
import {
  currencies,
  currencyUnit,
  fallbackFxResponse,
  formatAxisMoney,
  formatMoney,
  getCurrencyStatusLabel,
  getRateSyncLabel,
  mergeFxRates,
  type CurrencyCode,
  type FxRatesResponse,
} from '@/lib/currencies'
import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  BookOpenCheck,
  BriefcaseBusiness,
  Check,
  ChevronRight,
  CircleDollarSign,
  Fingerprint,
  LoaderCircle,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  type ChartOptions,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import { CenturyAiAdvisor } from '@/components/century-ai-advisor'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend)

type Language = 'en' | 'th'

type Inputs = {
  age: number
  savings: number
  emergencyFund: number
  monthlyExpenses: number
  investmentAllocation: number
  debtBalance: number
  monthlyDebtPayment: number
  annualIncomeGrowth: number
  retirementAge: number
  occupation: string
  baseSalary: number
  sideIncome: number
  incomeGoal: number
  health: 'excellent' | 'average' | 'at-risk'
  personality: 'aggressive' | 'balanced' | 'conservative' | 'impulse' | 'health-conscious'
}

const initialInputs: Inputs = {
  age: 25,
  savings: 100_000,
  emergencyFund: 60_000,
  monthlyExpenses: 25_000,
  investmentAllocation: 12_000,
  debtBalance: 180_000,
  monthlyDebtPayment: 8_000,
  annualIncomeGrowth: 4,
  retirementAge: 60,
  occupation: 'Tech & AI Specialist',
  baseSalary: 60_000,
  sideIncome: 5_000,
  incomeGoal: 100_000,
  health: 'average',
  personality: 'balanced',
}

const occupationOptions = [
  { label: 'Tech & AI Specialist', thai: 'ผู้เชี่ยวชาญเทคโนโลยีและ AI' },
  { label: 'Corporate & Business Manager', thai: 'ผู้จัดการองค์กรและธุรกิจ' },
  { label: 'Healthcare & Medical Professional', thai: 'บุคลากรด้านสุขภาพและการแพทย์' },
  { label: 'Creative, Media & Content Creator', thai: 'งานสร้างสรรค์ สื่อ และคอนเทนต์' },
  { label: 'Government Officer & Civil Servant', thai: 'เจ้าหน้าที่รัฐและข้าราชการ' },
  { label: 'Business Owner / SME Entrepreneur', thai: 'เจ้าของธุรกิจ / ผู้ประกอบการ SME' },
  { label: 'Freelance & Gig Economy Worker', thai: 'ฟรีแลนซ์และผู้ทำงานแพลตฟอร์ม' },
  { label: 'Skilled Trades & Engineering', thai: 'ช่างฝีมือและวิศวกรรม' },
  { label: 'Educator & Academic Researcher', thai: 'นักการศึกษาและนักวิจัย' },
  { label: 'Student / Early-Career Starter', thai: 'นักเรียน / ผู้เริ่มต้นอาชีพ' },
]

const healthCosts = { excellent: 24_000, average: 72_000, 'at-risk': 216_000 } as const
const expectedInvestmentReturn = 0.06
const expectedDebtInterest = 0.08
const expectedInflation = 0.025
const medicalInflation = 0.05
const savingsLeakage = { aggressive: 0.02, balanced: 0.04, conservative: 0.03, impulse: 0.18, 'health-conscious': 0.06 } as const
const habitScores = { aggressive: 88, balanced: 84, conservative: 90, impulse: 42, 'health-conscious': 82 } as const
const tx = (language: Language, english: string, thai: string) => language === 'th' ? thai : english

async function fetchFxRates(url: string): Promise<FxRatesResponse> {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Unable to load exchange rates: ${response.status}`)
  return response.json()
}

function InputSlider({
  label,
  value,
  min,
  max,
  step,
  suffix,
  icon: Icon,
  onChange,
  format,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  suffix?: string
  icon: typeof Wallet
  onChange: (value: number) => void
  format?: (value: number) => string
}) {
  const progress = ((value - min) / (max - min)) * 100
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
          <Icon className="size-4 text-slate-500" aria-hidden="true" />{label}
        </label>
        <div className="flex items-baseline gap-1 rounded-lg border border-white/[0.08] bg-white/[0.035] px-3 py-1.5 tabular-nums">
          <span className="text-sm font-semibold text-white">{format ? format(value) : value.toLocaleString()}</span>
          {suffix && <span className="text-xs text-slate-500">{suffix}</span>}
        </div>
      </div>
      <input
        aria-label={label}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-slate-700 accent-cyan-400 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-400"
        style={{ background: `linear-gradient(to right, #22d3ee 0%, #818cf8 ${progress}%, #26364b ${progress}%, #26364b 100%)` }}
      />
      <div className="flex justify-between text-[11px] text-slate-600">
        <span>{format ? format(min) : min}</span><span>{format ? format(max) : max}</span>
      </div>
    </div>
  )
}

function NumberField({
  id,
  label,
  value,
  min = 0,
  max,
  step = 1_000,
  suffix,
  displayRate = 1,
  fractionDigits = 0,
  onChange,
}: {
  id: string
  label: string
  value: number
  min?: number
  max?: number
  step?: number
  suffix: string
  displayRate?: number
  fractionDigits?: number
  onChange: (value: number) => void
}) {
  const displayValue = Number((value / displayRate).toFixed(fractionDigits))
  const displayMin = min / displayRate
  const displayMax = max === undefined ? undefined : max / displayRate
  const displayStep = Math.max(10 ** -fractionDigits, step / displayRate)

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-xs font-medium leading-4 text-slate-300">{label}</label>
      <div className="flex items-center gap-2 rounded-xl border border-white/[0.1] bg-[#111f31] px-3 transition-colors focus-within:border-cyan-300/60 focus-within:ring-2 focus-within:ring-cyan-300/20">
        <input
          id={id}
          type="number"
          min={displayMin}
          max={displayMax}
          step={displayStep}
          value={displayValue}
          onChange={(event) => {
            const nextValue = Number(event.target.value)
            if (Number.isFinite(nextValue)) {
              const valueInThb = Math.round(nextValue * displayRate)
              onChange(Math.max(min, max === undefined ? valueInThb : Math.min(max, valueInThb)))
            }
          }}
          className="min-w-0 flex-1 bg-transparent py-2.5 text-sm tabular-nums text-white outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        <span className="shrink-0 text-[10px] text-slate-500">{suffix}</span>
      </div>
    </div>
  )
}

function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  tone = 'cyan',
}: {
  label: string
  value: string
  detail: string
  icon: typeof TrendingUp
  tone?: 'cyan' | 'violet' | 'amber'
}) {
  const tones = {
    cyan: 'bg-cyan-400/10 text-cyan-300 ring-cyan-300/10',
    violet: 'bg-violet-400/10 text-violet-300 ring-violet-300/10',
    amber: 'bg-amber-400/10 text-amber-300 ring-amber-300/10',
  }
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#0b1727]/80 p-4 sm:p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-slate-400 sm:text-sm">{label}</p>
        <span className={`grid size-8 place-items-center rounded-lg ring-1 ${tones[tone]}`}><Icon className="size-4" aria-hidden="true" /></span>
      </div>
      <p className="mt-4 text-2xl font-semibold tracking-tight text-white sm:text-[28px]">{value}</p>
      <p className="mt-1.5 text-xs text-slate-500">{detail}</p>
    </div>
  )
}

export function LongevitySimulator() {
  const [inputs, setInputs] = useState(initialInputs)
  const [verified, setVerified] = useState(false)
  const [language, setLanguage] = useState<Language>('en')
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyCode>('THB')
  const [profileStep, setProfileStep] = useState(0)
  const { data: fxResponse, isLoading: ratesLoading, error: ratesError } = useSWR<FxRatesResponse>(
    '/api/fx-rates',
    fetchFxRates,
    { refreshInterval: 3_600_000, dedupingInterval: 3_600_000, revalidateOnFocus: true, revalidateOnReconnect: true },
  )
  const ratesToThb = useMemo(() => mergeFxRates(fxResponse), [fxResponse])
  const selectedCurrencyOption = currencies.find(({ code }) => code === selectedCurrency) ?? currencies[0]
  const currencyFractionDigits = selectedCurrency === 'THB' || selectedCurrency === 'JPY' ? 0 : 2
  const [analysisRunning, setAnalysisRunning] = useState(false)
  const [analysisComplete, setAnalysisComplete] = useState(false)
  const t = (english: string, thai: string) => tx(language, english, thai)
  const money = (value: number) => formatMoney(value, selectedCurrency, ratesToThb, language)
  const totalMonthlyIncome = inputs.baseSalary + inputs.sideIncome
  const occupation = occupationOptions.find((option) => option.label === inputs.occupation) ?? occupationOptions[0]
  const occupationName = t(occupation.label, occupation.thai)
  const updateInput = <Key extends keyof Inputs>(key: Key, value: Inputs[Key]) => {
    setAnalysisComplete(false)
    setInputs((current) => ({ ...current, [key]: value }))
  }
  const runAnalysis = () => {
    setAnalysisRunning(true)
    window.setTimeout(() => {
      setAnalysisComplete(true)
      setAnalysisRunning(false)
    }, 800)
  }

  const projection = useMemo(() => {
    const years = Math.max(0, 100 - inputs.age)
    const labels = Array.from({ length: years + 1 }, (_, index) => inputs.age + index)
    const lifestyleLeakage = savingsLeakage[inputs.personality]
    const monthlyInvestmentReturn = Math.pow(1 + expectedInvestmentReturn, 1 / 12) - 1
    const monthlyDebtInterest = Math.pow(1 + expectedDebtInterest, 1 / 12) - 1
    const monthlyIncomeGrowth = Math.pow(1 + inputs.annualIncomeGrowth / 100, 1 / 12) - 1
    const monthlyInflation = Math.pow(1 + expectedInflation, 1 / 12) - 1

    const simulate = (includeMedicalCosts: boolean) => {
      let investmentBalance = inputs.savings
      let cashBalance = inputs.emergencyFund
      let debtBalance = inputs.debtBalance
      let cumulativeMedicalCosts = 0
      let medicalCostsTo80 = 0
      let habitLeakageImpact = 0
      const wealth = [investmentBalance + cashBalance - debtBalance]

      for (let month = 1; month <= years * 12; month += 1) {
        const age = inputs.age + month / 12
        const income = age <= inputs.retirementAge
          ? (inputs.baseSalary + inputs.sideIncome) * Math.pow(1 + monthlyIncomeGrowth, month - 1)
          : 0
        const monthlyLivingExpenses = inputs.monthlyExpenses * Math.pow(1 + monthlyInflation, month)
        const medicalCost = includeMedicalCosts && age >= 60
          ? (healthCosts[inputs.health] * Math.pow(1 + medicalInflation, age - 60)) / 12
          : 0

        investmentBalance *= 1 + monthlyInvestmentReturn
        debtBalance *= 1 + monthlyDebtInterest
        cumulativeMedicalCosts += medicalCost
        if (age <= 80) medicalCostsTo80 += medicalCost

        const incomeAfterCosts = income - monthlyLivingExpenses - medicalCost
        const availableForDebtPayment = Math.max(0, incomeAfterCosts) + cashBalance + investmentBalance
        const debtPayment = Math.min(debtBalance, inputs.monthlyDebtPayment, availableForDebtPayment)
        debtBalance -= debtPayment

        const investmentContribution = Math.min(inputs.investmentAllocation, Math.max(0, incomeAfterCosts - debtPayment))
        const investedAfterLeakage = investmentContribution * (1 - lifestyleLeakage)
        investmentBalance += investedAfterLeakage
        habitLeakageImpact = habitLeakageImpact * (1 + expectedInvestmentReturn) + investmentContribution * lifestyleLeakage

        cashBalance += incomeAfterCosts - debtPayment - investmentContribution
        if (cashBalance < 0) {
          const shortfall = -cashBalance
          const portfolioWithdrawal = Math.min(investmentBalance, shortfall)
          investmentBalance -= portfolioWithdrawal
          cashBalance = 0
          debtBalance += shortfall - portfolioWithdrawal
        }

        if (month % 12 === 0) wealth.push(investmentBalance + cashBalance - debtBalance)
      }

      return { wealth, cumulativeMedicalCosts, medicalCostsTo80, habitLeakageImpact }
    }

    const withHealthcare = simulate(true)
    const withoutHealthcare = simulate(false)
    const nominal = withHealthcare.wealth
    const real = nominal.map((amount, index) => amount / Math.pow(1 + expectedInflation, index))
    const retirementIndex = Math.min(Math.max(0, inputs.retirementAge - inputs.age), years)
    const age80Index = Math.min(Math.max(0, 80 - inputs.age), years)
    const finalIndex = nominal.length - 1
    const healthScore = Math.min(99, Math.round(
      (inputs.health === 'excellent' ? 20 : inputs.health === 'average' ? 45 : 76) + Math.max(0, inputs.age - 50) * 0.35,
    ))

    return {
      labels,
      nominal,
      real,
      retirement: nominal[retirementIndex],
      age80: nominal[age80Index],
      age80Real: real[age80Index],
      yearsToRetirement: retirementIndex,
      cumulativeMedicalCosts: withHealthcare.cumulativeMedicalCosts,
      medicalCostsTo80: withHealthcare.medicalCostsTo80,
      habitLeakageImpact: withHealthcare.habitLeakageImpact,
      wealthRetention: withoutHealthcare.wealth[finalIndex] > 0
        ? Math.round((nominal[finalIndex] / withoutHealthcare.wealth[finalIndex]) * 100)
        : 0,
      healthScore,
    }
  }, [inputs])

  const incomeGap = inputs.incomeGoal - totalMonthlyIncome
  const habitScore = habitScores[inputs.personality]
  const lifestyleLeakage = savingsLeakage[inputs.personality]
  const profileStrategies = [
    totalMonthlyIncome < inputs.incomeGoal
      ? t(`Set a quarterly income milestone in ${occupationName.toLowerCase()} and direct half of each raise toward your target.`, `ตั้งเป้าหมายรายได้ทุกไตรมาสในสายงาน${occupationName} และนำรายได้ที่เพิ่มขึ้นครึ่งหนึ่งไปสู่เป้าหมายของคุณ`)
      : t(`Protect your ${occupationName.toLowerCase()} income with a six-month reserve and schedule an annual compensation review.`, `รักษาความมั่นคงของรายได้ในสายงาน${occupationName} ด้วยเงินสำรอง 6 เดือน และทบทวนค่าตอบแทนทุกปี`),
    inputs.health === 'at-risk'
      ? t('Price healthcare coverage before age 60 and build a dedicated medical reserve that grows with care costs.', 'เปรียบเทียบความคุ้มครองสุขภาพก่อนอายุ 60 ปี และสร้างเงินสำรองค่ารักษาที่เติบโตตามค่าใช้จ่าย')
      : t('Schedule preventive health reviews and reserve a small monthly amount for future care costs.', 'ตรวจสุขภาพเชิงป้องกันตามกำหนด และกันเงินรายเดือนส่วนหนึ่งไว้สำหรับค่าดูแลสุขภาพในอนาคต'),
    inputs.personality === 'impulse'
      ? t('Automate savings on payday and add a 24-hour pause before non-essential purchases.', 'ตั้งโอนเงินออมอัตโนมัติในวันเงินเดือนออก และเว้น 24 ชั่วโมงก่อนซื้อของที่ไม่จำเป็น')
      : inputs.personality === 'aggressive'
        ? t('Set a risk limit and rebalance on a schedule so long-term goals stay ahead of market swings.', 'กำหนดขีดจำกัดความเสี่ยงและปรับสมดุลพอร์ตตามกำหนด เพื่อให้เป้าหมายระยะยาวไม่ผันผวนตามตลาด')
        : t('Automate a consistent savings contribution and review your spending plan once each month.', 'ตั้งออมเงินสม่ำเสมอโดยอัตโนมัติ และทบทวนแผนรายจ่ายเดือนละครั้ง'),
  ]

  const chartData = useMemo(() => ({
    labels: projection.labels,
    datasets: [
      {
        label: t('Health- and habit-adjusted wealth', 'ความมั่งคั่งหลังปรับสุขภาพและพฤติกรรม'),
        data: projection.nominal,
        borderColor: '#22d3ee',
        backgroundColor: (context: { chart: ChartJS }) => {
          const { ctx, chartArea } = context.chart
          if (!chartArea) return 'rgba(34, 211, 238, 0.08)'
          const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom)
          gradient.addColorStop(0, 'rgba(34, 211, 238, 0.19)')
          gradient.addColorStop(1, 'rgba(34, 211, 238, 0)')
          return gradient
        },
        fill: true,
        borderWidth: 2.5,
        pointRadius: 0,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: '#22d3ee',
        tension: 0.32,
      },
      {
        label: t('Inflation-adjusted value', 'มูลค่าปรับตามเงินเฟ้อ'),
        data: projection.real,
        borderColor: '#a78bfa',
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderDash: [6, 5],
        pointRadius: 0,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: '#a78bfa',
        tension: 0.32,
      },
    ],
  }), [projection, language, selectedCurrency, ratesToThb])

  const chartOptions: ChartOptions<'line'> = useMemo(() => ({
    responsive: true,
    font: { family: '"Noto Sans Thai", sans-serif' },
    maintainAspectRatio: false,
    interaction: { intersect: false, mode: 'index' },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#101e30',
        borderColor: 'rgba(148, 163, 184, 0.18)',
        borderWidth: 1,
        titleColor: '#e2e8f0',
        bodyColor: '#cbd5e1',
        padding: 12,
        callbacks: {
          title: (items) => `${t('Age', 'อายุ')} ${items[0]?.label ?? ''}`,
          label: (item) => ` ${item.dataset.label}: ${money(Number(item.raw))}`,
        },
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(148, 163, 184, 0.07)', drawTicks: false },
        border: { display: false },
        ticks: { color: '#64748b', maxTicksLimit: 8, maxRotation: 0, padding: 10, font: { size: 10 } },
      },
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(148, 163, 184, 0.08)', drawTicks: false },
        border: { display: false },
        ticks: {
          color: '#64748b',
          maxTicksLimit: 5,
          padding: 12,
          font: { size: 10 },
          callback: (value) => formatAxisMoney(Number(value), selectedCurrency, ratesToThb, language),
        },
      },
    },
  }), [language, selectedCurrency, ratesToThb])

  const monthlyTarget = totalMonthlyIncome * 0.2
  const recommendation = inputs.investmentAllocation < monthlyTarget
    ? t(`You’re investing ${money(inputs.investmentAllocation)} each month. Increasing that by ${money(monthlyTarget - inputs.investmentAllocation)} could strengthen your long-term security. Small, consistent steps have a powerful effect over ${projection.yearsToRetirement} years.`, `คุณลงทุน ${money(inputs.investmentAllocation)} ต่อเดือน การเพิ่มเงินลงทุนอีก ${money(monthlyTarget - inputs.investmentAllocation)} จะช่วยเสริมความมั่นคงในระยะยาว การลงทุนอย่างสม่ำเสมอแม้ทีละน้อยส่งผลดีได้ตลอด ${projection.yearsToRetirement} ปี`)
    : t(`Your monthly savings are building a strong foundation. With ${projection.yearsToRetirement} years until your target retirement, consider a yearly review to keep your plan aligned with the life you want to live.`, `เงินออมรายเดือนของคุณกำลังสร้างรากฐานที่มั่นคง อีก ${projection.yearsToRetirement} ปีก่อนถึงวัยเกษียณที่ตั้งเป้าหมายไว้ ลองทบทวนแผนทุกปีเพื่อให้สอดคล้องกับชีวิตที่คุณต้องการ`)

  return (
    <main lang={language} className="min-h-screen overflow-hidden bg-[#07111f] text-slate-100">
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_50%_-15%,rgba(34,211,238,0.11),transparent_42%),radial-gradient(ellipse_at_100%_60%,rgba(124,58,237,0.09),transparent_35%)]" />
      <div className="relative mx-auto max-w-[1440px] px-4 pb-12 sm:px-7 lg:px-10">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.07] py-5">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl border border-cyan-300/20 bg-cyan-300/[0.09] text-cyan-300"><TrendingUp className="size-5" aria-hidden="true" /></div>
            <div>
              <p className="text-[15px] font-semibold tracking-tight text-white">Gen-Century Plan</p>
              <p className="mt-0.5 text-[11px] tracking-wide text-slate-500">{t('YOUR 100-YEAR LIFE SIMULATOR', 'เครื่องมือจำลองชีวิต 100 ปี')}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[11px] sm:gap-3">
            <div className="flex flex-col items-start gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <label htmlFor="display-currency" className="sr-only">{t('Display currency', 'สกุลเงินที่แสดง')}</label>
                <select
                  id="display-currency"
                  value={selectedCurrency}
                  onChange={(event) => setSelectedCurrency(event.target.value as CurrencyCode)}
                  aria-label={t('Display currency', 'สกุลเงินที่แสดง')}
                  className="max-w-[190px] rounded-full border border-cyan-300/25 bg-[#101e30] px-3 py-1.5 text-[11px] font-semibold text-cyan-100 outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60"
                >
                  {currencies.map(({ code, symbol, name }) => (
                    <option key={code} value={code}>{code} · {symbol} · {name}</option>
                  ))}
                </select>
                <span
                  className="inline-flex items-center gap-1.5 rounded-full border border-cyan-300/20 bg-cyan-300/[0.07] px-2.5 py-1.5 text-[9px] font-medium text-cyan-200"
                  aria-label={getCurrencyStatusLabel(language, ratesLoading, Boolean(ratesError), fxResponse?.date, fxResponse?.source)}
                  title={getCurrencyStatusLabel(language, ratesLoading, Boolean(ratesError), fxResponse?.date, fxResponse?.source)}
                >
                  <Activity className={`size-3 shrink-0 ${ratesLoading ? 'animate-pulse' : ''}`} aria-hidden="true" />
                  {getRateSyncLabel(language)}
                </span>
              </div>
              <span className="pl-1 text-[9px] text-slate-500">{getCurrencyStatusLabel(language, ratesLoading, Boolean(ratesError), fxResponse?.date, fxResponse?.source)}</span>
            </div>
            <button
              type="button"
              onClick={() => setLanguage((current) => current === 'en' ? 'th' : 'en')}
              aria-label={t('Switch to Thai', 'เปลี่ยนเป็นภาษาอังกฤษ')}
              className="rounded-full border border-cyan-300/25 bg-cyan-300/[0.08] px-3 py-1.5 font-semibold text-cyan-200 transition-colors hover:bg-cyan-300/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
            >
              {language === 'en' ? 'ไทย' : 'English'}
            </button>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/[0.08] px-3 py-1.5 font-medium text-emerald-300"><BadgeCheck className="size-3.5" aria-hidden="true" />{t('PDPA Compliant', 'สอดคล้องกับ PDPA')}</span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.035] px-3 py-1.5 text-slate-400"><span className="size-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />{t('Hardware Token Connected', 'เชื่อมต่อโทเค็นฮาร์ดแวร์แล้ว')} <span className="hidden text-slate-600 sm:inline">(#HK-2026-SECURED)</span></span>
          </div>
        </header>

        <section className="mt-6 flex flex-col justify-between gap-4 overflow-hidden rounded-2xl border border-cyan-300/15 bg-gradient-to-r from-[#0b2333] via-[#102034] to-[#171632] p-5 sm:flex-row sm:items-center sm:px-6 sm:py-5" aria-label={t('Hardware security simulator', 'เครื่องมือจำลองความปลอดภัยฮาร์ดแวร์')}>
          <div className="flex items-start gap-4">
            <div className="grid size-11 shrink-0 place-items-center rounded-xl border border-cyan-200/15 bg-cyan-300/[0.08] text-cyan-300"><Fingerprint className="size-5" aria-hidden="true" /></div>
            <div>
              <p className="text-sm font-semibold text-white">{t('Your future deserves a secure foundation', 'อนาคตของคุณเริ่มต้นจากรากฐานที่มั่นคง')}</p>
              <p className="mt-1 max-w-xl text-xs leading-5 text-slate-400">{t('Hardware-backed identity simulation with privacy-first planning. Your financial inputs stay in this browser.', 'จำลองการยืนยันตัวตนด้วยฮาร์ดแวร์ พร้อมวางแผนโดยคำนึงถึงความเป็นส่วนตัว ข้อมูลการเงินของคุณจะอยู่ในเบราว์เซอร์นี้เท่านั้น')}</p>
              {verified && <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-emerald-300"><Check className="size-3.5" aria-hidden="true" />{t('Zero-Knowledge Encryption Active', 'เปิดใช้งานการเข้ารหัสแบบไม่เปิดเผยข้อมูล')}</p>}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setVerified((current) => !current)}
            aria-pressed={verified}
            className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300 ${verified ? 'border border-emerald-300/25 bg-emerald-300/10 text-emerald-200' : 'bg-cyan-300 text-[#07111f] shadow-[0_0_22px_rgba(34,211,238,0.16)] hover:bg-cyan-200'}`}
          >
            {verified ? <ShieldCheck className="size-4" aria-hidden="true" /> : <LockKeyhole className="size-4" aria-hidden="true" />}
            {verified ? t('Identity Verified', 'ยืนยันตัวตนแล้ว') : t('Verify Identity with Hardware Device', 'ยืนยันตัวตนด้วยอุปกรณ์ฮาร์ดแวร์')}
          </button>
        </section>

        <div className="mb-5 mt-9 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300/80">{t('Your financial future', 'อนาคตทางการเงินของคุณ')}</p>
            <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-white sm:text-[30px]">{t('Plan for the life ahead.', 'วางแผนเพื่อชีวิตในวันข้างหน้า')}</h1>
          </div>
          <p className="text-xs text-slate-500">{t('A personal projection, from today through age 100', 'ประมาณการส่วนบุคคลตั้งแต่วันนี้จนถึงอายุ 100 ปี')}</p>
        </div>

        <div className="grid items-start gap-5 xl:grid-cols-[340px_minmax(0,1fr)]">
          <div className="flex min-w-0 flex-col gap-5">
          <section className="rounded-2xl border border-white/[0.08] bg-[#0b1727]/85 p-5 shadow-[0_14px_50px_rgba(0,0,0,0.12)] sm:p-6" aria-labelledby="inputs-heading">
            <div className="flex items-center justify-between">
              <div><h2 id="inputs-heading" className="text-base font-semibold text-white">{t('Your starting point', 'ข้อมูลตั้งต้นของคุณ')}</h2><p className="mt-1 text-xs text-slate-500">{t('Adjust your plan in real time', 'ปรับแผนของคุณได้ทันที')}</p></div>
              <span className="rounded-lg border border-white/[0.08] bg-white/[0.035] px-2.5 py-1 text-[10px] font-medium text-slate-400">{selectedCurrency} · {selectedCurrencyOption.name}</span>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-1 rounded-xl border border-white/[0.06] bg-black/15 p-1" aria-label={t('Profile steps', 'ขั้นตอนการวิเคราะห์โปรไฟล์')}>
              {[
                t('Finances', 'การเงิน'),
                t('Career', 'อาชีพ'),
                t('Health & habits', 'สุขภาพและพฤติกรรม'),
              ].map((step, index) => (
                <button key={step} type="button" onClick={() => setProfileStep(index)} aria-current={profileStep === index ? 'step' : undefined} className={`rounded-lg px-1.5 py-2 text-[10px] font-medium transition-colors ${profileStep === index ? 'bg-cyan-300/10 text-cyan-200' : 'text-slate-500 hover:text-slate-300'}`}>
                  <span className="mr-1 opacity-70">0{index + 1}</span>{step}
                </button>
              ))}
            </div>
            <div className="mt-7 flex min-h-[350px] flex-col gap-7">
              {profileStep === 0 && <>
                <InputSlider label={t('Current age', 'อายุปัจจุบัน')} icon={CircleDollarSign} value={inputs.age} min={18} max={65} step={1} suffix={t('years', 'ปี')} onChange={(value) => updateInput('age', Math.min(value, inputs.retirementAge - 1))} />
                <NumberField id="current-savings" label={t('Current savings & investments', 'เงินออมและเงินลงทุนปัจจุบัน')} value={inputs.savings} max={100_000_000} suffix={currencyUnit(selectedCurrency)} displayRate={ratesToThb[selectedCurrency]} fractionDigits={currencyFractionDigits} onChange={(value) => updateInput('savings', value)} />
                <NumberField id="emergency-fund" label={t('Emergency fund balance', 'ยอดเงินสำรองฉุกเฉิน')} value={inputs.emergencyFund} max={100_000_000} suffix={currencyUnit(selectedCurrency)} displayRate={ratesToThb[selectedCurrency]} fractionDigits={currencyFractionDigits} onChange={(value) => updateInput('emergencyFund', value)} />
                <NumberField id="fixed-living-expenses" label={t('Fixed living expenses', 'ค่าใช้จ่ายประจำต่อเดือน')} value={inputs.monthlyExpenses} max={2_000_000} suffix={currencyUnit(selectedCurrency, true)} displayRate={ratesToThb[selectedCurrency]} fractionDigits={currencyFractionDigits} onChange={(value) => updateInput('monthlyExpenses', value)} />
                <NumberField id="monthly-investment-allocation" label={t('Monthly investment allocation', 'เงินลงทุนต่อเดือน')} value={inputs.investmentAllocation} max={2_000_000} suffix={currencyUnit(selectedCurrency, true)} displayRate={ratesToThb[selectedCurrency]} fractionDigits={currencyFractionDigits} onChange={(value) => updateInput('investmentAllocation', value)} />
                <NumberField id="current-total-debt" label={t('Current total debt / loans', 'ยอดหนี้ / เงินกู้ปัจจุบัน')} value={inputs.debtBalance} max={100_000_000} suffix={currencyUnit(selectedCurrency)} displayRate={ratesToThb[selectedCurrency]} fractionDigits={currencyFractionDigits} onChange={(value) => updateInput('debtBalance', value)} />
                <NumberField id="monthly-debt-repayment" label={t('Monthly debt repayment', 'ยอดชำระหนี้ต่อเดือน')} value={inputs.monthlyDebtPayment} max={2_000_000} suffix={currencyUnit(selectedCurrency, true)} displayRate={ratesToThb[selectedCurrency]} fractionDigits={currencyFractionDigits} onChange={(value) => updateInput('monthlyDebtPayment', value)} />
                <NumberField id="annual-income-growth" label={t('Expected annual income growth rate', 'อัตราการเติบโตของรายได้ต่อปี')} value={inputs.annualIncomeGrowth} max={20} step={0.1} suffix="% / year" onChange={(value) => updateInput('annualIncomeGrowth', value)} />
                <InputSlider label={t('Retirement target age', 'อายุเป้าหมายเกษียณ')} icon={BriefcaseBusiness} value={inputs.retirementAge} min={Math.max(30, inputs.age + 1)} max={75} step={1} suffix={t('years', 'ปี')} onChange={(value) => updateInput('retirementAge', value)} />
              </>}
              {profileStep === 1 && <>
                <label className="flex flex-col gap-2 text-sm font-medium text-slate-300">
                  <span className="flex items-center gap-2"><BriefcaseBusiness className="size-4 text-slate-500" aria-hidden="true" />{t('Occupation / career track', 'อาชีพ / สายงาน')}</span>
                  <select value={inputs.occupation} onChange={(event) => updateInput('occupation', event.target.value)} className="rounded-xl border border-white/[0.1] bg-[#111f31] px-3 py-3 text-sm text-white outline-none focus-visible:border-cyan-300/60 focus-visible:ring-2 focus-visible:ring-cyan-300/20">
                    {occupationOptions.map((option) => <option key={option.label} value={option.label}>{t(option.label, option.thai)}</option>)}
                  </select>
                </label>
                <NumberField id="base-salary" label={t('Base salary', 'เงินเดือนประจำ')} value={inputs.baseSalary} max={2_000_000} suffix={currencyUnit(selectedCurrency, true)} displayRate={ratesToThb[selectedCurrency]} fractionDigits={currencyFractionDigits} onChange={(value) => updateInput('baseSalary', value)} />
                <NumberField id="side-hustle-income" label={t('Side hustle / freelance income', 'รายได้เสริมหรือฟรีแลนซ์')} value={inputs.sideIncome} max={2_000_000} suffix={currencyUnit(selectedCurrency, true)} displayRate={ratesToThb[selectedCurrency]} fractionDigits={currencyFractionDigits} onChange={(value) => updateInput('sideIncome', value)} />
                <NumberField id="monthly-income-goal" label={t('Target monthly income goal', 'เป้าหมายรายได้ต่อเดือน')} value={inputs.incomeGoal} max={2_000_000} suffix={currencyUnit(selectedCurrency, true)} displayRate={ratesToThb[selectedCurrency]} fractionDigits={currencyFractionDigits} onChange={(value) => updateInput('incomeGoal', value)} />
                <p className="rounded-xl border border-cyan-300/10 bg-cyan-300/[0.035] p-3 text-xs leading-5 text-slate-400">{t('Combined income and your annual growth assumption feed directly into the 100-year projection.', 'รายได้รวมและสมมติฐานการเติบโตต่อปีจะถูกนำไปคำนวณในการประมาณการ 100 ปีโดยตรง')}</p>
              </>}
              {profileStep === 2 && <>
                <label className="flex flex-col gap-2 text-sm font-medium text-slate-300">
                  <span className="flex items-center gap-2"><ShieldCheck className="size-4 text-slate-500" aria-hidden="true" />{t('Current health status', 'สถานะสุขภาพปัจจุบัน')}</span>
                  <select value={inputs.health} onChange={(event) => updateInput('health', event.target.value as Inputs['health'])} className="rounded-xl border border-white/[0.1] bg-[#111f31] px-3 py-3 text-sm text-white outline-none focus-visible:border-cyan-300/60 focus-visible:ring-2 focus-visible:ring-cyan-300/20">
                    <option value="excellent">{t('Excellent', 'ดีเยี่ยม')}</option>
                    <option value="average">{t('Average', 'ปานกลาง')}</option>
                    <option value="at-risk">{t('At-Risk or Chronic Condition', 'มีความเสี่ยงหรือโรคเรื้อรัง')}</option>
                  </select>
                </label>
                <label className="flex flex-col gap-2 text-sm font-medium text-slate-300">
                  <span className="flex items-center gap-2"><CircleDollarSign className="size-4 text-slate-500" aria-hidden="true" />{t('Financial personality', 'บุคลิกภาพทางการเงิน')}</span>
                  <select value={inputs.personality} onChange={(event) => updateInput('personality', event.target.value as Inputs['personality'])} className="rounded-xl border border-white/[0.1] bg-[#111f31] px-3 py-3 text-sm text-white outline-none focus-visible:border-cyan-300/60 focus-visible:ring-2 focus-visible:ring-cyan-300/20">
                    <option value="aggressive">{t('Aggressive Investor', 'นักลงทุนเชิงรุก')}</option>
                    <option value="balanced">{t('Balanced', 'สมดุล')}</option>
                    <option value="conservative">{t('Conservative Saver', 'ผู้ออมแบบระมัดระวัง')}</option>
                    <option value="impulse">{t('Impulse Spender', 'ใช้จ่ายตามอารมณ์')}</option>
                    <option value="health-conscious">{t('Health Conscious', 'ใส่ใจสุขภาพ')}</option>
                  </select>
                </label>
                <p className="rounded-xl border border-violet-300/10 bg-violet-300/[0.035] p-3 text-xs leading-5 text-slate-400">{t('At-risk projections include higher annual medical costs from age 60. Habit patterns also adjust savings leakage.', 'การประเมินความเสี่ยงด้านสุขภาพจะรวมค่ารักษาที่สูงขึ้นตั้งแต่อายุ 60 ปี และปรับการรั่วไหลของเงินออมตามพฤติกรรม')}</p>
              </>}
            </div>
            <div className="mt-6 flex items-center justify-between border-t border-white/[0.07] pt-4">
              <button type="button" disabled={profileStep === 0} onClick={() => setProfileStep((step) => Math.max(0, step - 1))} className="rounded-lg px-3 py-2 text-xs font-medium text-slate-400 transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-30">{t('Back', 'ย้อนกลับ')}</button>
              <span className="text-[10px] text-slate-600">{t(`Step ${profileStep + 1} of 3`, `ขั้นตอนที่ ${profileStep + 1} จาก 3`)}</span>
              <button type="button" disabled={profileStep === 2} onClick={() => setProfileStep((step) => Math.min(2, step + 1))} className="inline-flex items-center gap-1 rounded-lg bg-cyan-300/10 px-3 py-2 text-xs font-semibold text-cyan-200 transition-colors hover:bg-cyan-300/15 disabled:cursor-not-allowed disabled:opacity-30">{t('Next', '���ัดไป')}<ChevronRight className="size-3.5" aria-hidden="true" /></button>
            </div>
            <div className="mt-5 flex items-start gap-2.5 border-t border-white/[0.07] pt-4 text-[11px] leading-5 text-slate-500"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-cyan-400/70" aria-hidden="true" /><p>{t('Illustrative model: 6% annual investment return, 8% debt interest, 2.5% living-cost inflation, and 5% medical inflation. Income growth follows your assumption; earned income stops at retirement age, and no pension is assumed. Not financial advice.', 'แบบจำลองประกอบการศึกษา: ผลตอบแทนการลงทุน 6% ต่อปี ดอกเบี้ยหนี้ 8% เงินเฟ้อค่าครองชีพ 2.5% และเงินเฟ้อค่ารักษา 5% การเติบโตของรายได้ใช้ตามสมมติฐานที่เลือก รายได้จากการทำงานหยุดเมื่อถึงอายุเกษียณและไม่ได้สมมติรายได้จากเงินบำนาญ ไม่ใช่คำแนะนำทางการเงิน')}</p></div>
          </section>
          </div>

          <div className="min-w-0 space-y-5">
            <div className="grid items-start gap-5 2xl:grid-cols-[minmax(0,1fr)_320px]">
              <div className="min-w-0 space-y-5">
            <section className="rounded-2xl border border-white/[0.08] bg-[#0b1727]/85 p-5 shadow-[0_14px_50px_rgba(0,0,0,0.12)] sm:p-6" aria-labelledby="projection-heading">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div><h2 id="projection-heading" className="text-base font-semibold text-white">{t('Your 100-year wealth journey', 'เส้นทางความมั่งคั่งตลอด 100 ปี')}</h2><p className="mt-1 text-xs text-slate-500">{t('A long view, built one month at a time', 'มองภาพระยะยาว วางแผนทีละเดือน')}</p></div>
                <div className="flex flex-wrap gap-x-4 gap-y-2 text-[11px]">
                  <span className="flex items-center gap-2 text-slate-300"><span className="h-0.5 w-4 rounded bg-cyan-300" />{t('Health- and habit-adjusted', 'ปรับตามสุขภาพและพฤติกรรม')}</span>
                  <span className="flex items-center gap-2 text-slate-400"><span className="w-4 border-t-2 border-dashed border-violet-400" />{t('Inflation-adjusted', 'ปรับตามเงินเฟ้อ')}</span>
                </div>
              </div>
              <div className="mt-6 h-[255px] w-full sm:h-[300px]" role="img" aria-label={t(`Projected health- and habit-adjusted wealth from age ${inputs.age} through age 100. Projected wealth at age 80 is ${money(projection.age80)}; inflation-adjusted value is ${money(projection.age80Real)}.`, `ประมาณการความมั่งคั่งที่ปรับตามสุขภาพและพฤติกรรมตั้งแต่อายุ ${inputs.age} ถึง 100 ปี มูลค่าที่คาดการณ์เมื่ออายุ 80 ปีคือ ${money(projection.age80)} และมูลค่าที่ปรับตามเงินเฟ้อคือ ${money(projection.age80Real)}`)}>
                <Line data={chartData} options={chartOptions} />
              </div>
            </section>
            <div className="grid gap-3 sm:grid-cols-3">
              <MetricCard label={t('Wealth at retirement', 'ความมั่งคั่งเมื่อเกษียณ')} value={money(projection.retirement)} detail={t(`At age ${inputs.retirementAge} · ${projection.yearsToRetirement} years from now`, `เมื่ออายุ ${inputs.retirementAge} · อีก ${projection.yearsToRetirement} ปี`)} icon={TrendingUp} />
              <MetricCard label={t('Wealth at age 80', 'ความมั่งคั่งเมื่ออายุ 80 ปี')} value={money(projection.age80)} detail={t(`${money(projection.age80Real)} in today’s money`, `${money(projection.age80Real)} ในมูลค่าเงินปัจจุบัน`)} icon={Wallet} tone="violet" />
              <MetricCard label={t('Inflation loss impact', 'ผลกระทบจากเงินเฟ้อ')} value={money(projection.age80 - projection.age80Real)} detail={t('Purchasing power difference at age 80', 'ส่วนต่างของกำลังซื้อเมื่ออายุ 80 ปี')} icon={ArrowDownRight} tone="amber" />
            </div>
              </div>
              <CenturyAiAdvisor career={inputs.occupation} health={inputs.health} debt={inputs.debtBalance} monthlyDebtPayment={inputs.monthlyDebtPayment} currencyCode={selectedCurrency} ratesToThb={ratesToThb} language={language} />
            </div>
            <section className="mt-5 space-y-4" aria-labelledby="deep-analysis-heading" aria-busy={analysisRunning}>
              <div className="flex flex-col justify-between gap-3 rounded-2xl border border-cyan-300/15 bg-gradient-to-r from-cyan-300/[0.06] via-[#0b1727] to-violet-300/[0.07] p-4 sm:flex-row sm:items-center sm:px-5">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-200/80">{t('Personalized projection', 'ประมาณการเฉพาะบุคคล')}</p>
                  <h2 id="deep-analysis-heading" className="mt-1 text-base font-semibold text-white">{t('Deep longevity analysis', 'วิเคราะห์ชีวิตยืนยาวเชิงลึก')}</h2>
                  <p className="mt-1 text-xs text-slate-400">{analysisComplete ? t('Your profile analysis is ready. Edit inputs to refresh it.', 'วิเคราะห์โปรไฟล์เรียบร้อยแล้ว แก้ไขข้อมูลเพื่อคำนวณใหม่') : t('Run your profile to reveal four tailored financial insights.', 'วิเคราะห์โปรไฟล์เพื่อดูข้อมูลเชิงลึกทางการเงิน 4 ด้าน')}</p>
                </div>
                <button type="button" onClick={runAnalysis} disabled={analysisRunning} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-cyan-300 px-4 py-3 text-xs font-semibold text-[#07111f] shadow-[0_0_24px_rgba(34,211,238,0.12)] transition-colors hover:bg-cyan-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300 disabled:cursor-wait disabled:opacity-70">
                  {analysisRunning ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <Sparkles className="size-4" aria-hidden="true" />}
                  {analysisRunning ? t('Analyzing your profile…', 'กำลังวิเคราะห์โปรไฟล์…') : analysisComplete ? t('Run analysis again', 'วิเคราะห์อีกครั้ง') : t('Run Deep Longevity Analysis', 'เริ่มวิเคราะห์ชีวิตยืนยาวเชิงลึก')}
                </button>
              </div>
              <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-4">
                <article className="rounded-2xl border border-cyan-300/10 bg-[#0b1727]/85 p-4 sm:p-5">
                  <div className="flex items-center gap-2 text-cyan-200"><span className="grid size-8 place-items-center rounded-lg bg-cyan-300/10"><TrendingUp className="size-4" aria-hidden="true" /></span><h3 className="text-sm font-semibold text-white">{t('Income vs Goal Gap Analysis', 'วิเคราะห์ช่องว่างรายได้กับเป้าหมาย')}</h3></div>
                  <p className="mt-5 text-[10px] font-medium uppercase tracking-wider text-slate-500">{t('Monthly income gap', 'ช่องว่างรายได้ต่อเดือน')}</p>
                  <p className="mt-1 text-2xl font-semibold tracking-tight text-white">{analysisComplete ? money(Math.max(0, incomeGap)) : '—'}</p>
                  <p className="mt-2 text-xs leading-5 text-slate-400">{analysisComplete ? incomeGap > 0 ? t(`Current ${money(totalMonthlyIncome)} · goal ${money(inputs.incomeGoal)}`, `ปัจจุบัน ${money(totalMonthlyIncome)} · เป้าหมาย ${money(inputs.incomeGoal)}`) : t('You have reached or exceeded your monthly income goal.', 'คุณบรรลุหรือมีรายได้ถึงเป้าหมายต่อเดือนแล้ว') : t('Run the analysis to calculate your income-to-goal gap.', 'เริ่มวิเคราะห์เพื่อคำนวณช่องว่างระหว่างรายได้กับเป��าหมาย')}</p>
                  <p className="mt-3 border-t border-white/[0.06] pt-3 text-[10px] text-slate-500">{t('Career track', 'สายอาชีพ')}: <span className="text-slate-300">{occupationName}</span></p>
                </article>
                <article className="rounded-2xl border border-rose-300/10 bg-[#0b1727]/85 p-4 sm:p-5">
                  <div className="flex items-center gap-2 text-rose-200"><span className="grid size-8 place-items-center rounded-lg bg-rose-300/10"><Activity className="size-4" aria-hidden="true" /></span><h3 className="text-sm font-semibold text-white">{t('Health & Medical Cost Risk Index', 'ดัชนีความเสี่ยงสุขภาพและค่ารักษา')}</h3></div>
                  <p className="mt-5 text-[10px] font-medium uppercase tracking-wider text-slate-500">{t('Health risk score', 'คะแนนความเสี่ยงสุขภาพ')}</p>
                  <p className="mt-1 text-2xl font-semibold tracking-tight text-white">{analysisComplete ? `${projection.healthScore} / 100` : '—'}</p>
                  <p className="mt-2 text-xs leading-5 text-slate-400">{analysisComplete ? t(`Projected medical costs to age 80: ${money(projection.medicalCostsTo80)}`, `ประมาณการค่ารักษาสะสมถึงอายุ 80 ปี: ${money(projection.medicalCostsTo80)}`) : t('Run the analysis to estimate health costs after age 60.', 'เริ่มวิเคราะห์เพื่อประเมินค่ารักษาหลังอายุ 60 ปี')}</p>
                  <p className="mt-3 border-t border-white/[0.06] pt-3 text-[10px] text-slate-500">{t('100-year wealth retained vs. same plan without medical costs', 'ความมั่งคั่งที่เหลือเทียบแผนเดียวกันที่ไม่มีค่ารักษาในช่วง 100 ปี')}: <span className="font-semibold text-rose-200">{analysisComplete ? `${projection.wealthRetention}%` : '—'}</span></p>
                </article>
                <article className="rounded-2xl border border-violet-300/10 bg-[#0b1727]/85 p-4 sm:p-5">
                  <div className="flex items-center gap-2 text-violet-200"><span className="grid size-8 place-items-center rounded-lg bg-violet-300/10"><Wallet className="size-4" aria-hidden="true" /></span><h3 className="text-sm font-semibold text-white">{t('Habit Score & Wealth Leakage', 'คะแนนพฤติกรรมและเงินออมที่รั่วไหล')}</h3></div>
                  <p className="mt-5 text-[10px] font-medium uppercase tracking-wider text-slate-500">{t('Financial habit score', 'คะแนนพฤติกรรมทางการเงิน')}</p>
                  <p className="mt-1 text-2xl font-semibold tracking-tight text-white">{analysisComplete ? `${habitScore} / 100` : '—'}</p>
                  <p className="mt-2 text-xs leading-5 text-slate-400">{analysisComplete ? t(`Modeled savings leakage: ${Math.round(lifestyleLeakage * 100)}% of monthly investment allocation`, `จำลองเงินลงทุนที่รั่วไหล: ${Math.round(lifestyleLeakage * 100)}% ของเงินลงทุนรายเดือน`) : t('Run the analysis to score your financial habits.', 'เริ่มวิเคราะห์เพื่อประเมินพฤติกรรมทางการเงิน')}</p>
                  <p className="mt-3 border-t border-white/[0.06] pt-3 text-[10px] text-slate-500">{t('Potential wealth impact by age 100', 'ผลกระทบต่อความมั่งคั่งที่อาจเกิดขึ้นเมื่ออายุ 100 ปี')}: <span className="font-semibold text-violet-200">{analysisComplete ? money(projection.habitLeakageImpact) : '—'}</span></p>
                </article>
                <article className="rounded-2xl border border-amber-300/10 bg-[#0b1727]/85 p-4 sm:p-5">
                  <div className="flex items-center gap-2 text-amber-200"><span className="grid size-8 place-items-center rounded-lg bg-amber-300/10"><Sparkles className="size-4" aria-hidden="true" /></span><h3 className="text-sm font-semibold text-white">{t('AI Personalized Action Plan', 'แผนปฏิบัติการเฉพาะบุคคล')}</h3></div>
                  <p className="mt-2 text-[10px] leading-4 text-slate-500">{t('Profile-based simulation · not generated by an AI model', 'คำแนะนำจำลองตามโปรไฟล์ · ไม่ได้สร้างโดยโมเดล AI')}</p>
                  {analysisComplete ? <ol className="mt-3 flex flex-col gap-2.5">
                    {profileStrategies.map((strategy, index) => <li key={strategy} className="flex gap-2 text-xs leading-5 text-slate-300"><span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-amber-300/10 text-[10px] font-semibold text-amber-200">{index + 1}</span><span>{strategy}</span></li>)}
                  </ol> : <p className="mt-3 text-xs leading-5 text-slate-400">{t('Run the analysis to reveal three strategies matched to your career, health, and financial habits.', 'เริ่มวิเคราะห์เพื่อดู 3 กลยุทธ์ที่ปรับตามอาชีพ สุขภาพ และพฤติกรรมการเงินของคุณ')}</p>}
                </article>
              </div>
            </section>
          </div>
        </div>

        <section className="mt-9" aria-labelledby="insights-heading">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div><p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-300/80">{t('Beyond the numbers', 'มากกว่าตัวเลข')}</p><h2 id="insights-heading" className="mt-1.5 text-xl font-semibold tracking-tight text-white">{t('Make your next century count.', 'ใช้ทุกช่วงเวลาในศตวรรษหน้าให้คุ้มค่า')}</h2></div>
            <span className="hidden items-center gap-1.5 rounded-full border border-violet-300/15 bg-violet-300/[0.07] px-3 py-1.5 text-[10px] font-medium text-violet-200 sm:inline-flex"><Sparkles className="size-3" aria-hidden="true" />{t('PERSONALIZED FOR YOU', 'ปรับให้เหมาะกับคุณ')}</span>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <article className="rounded-2xl border border-violet-300/15 bg-gradient-to-br from-[#171732] to-[#101c30] p-5 lg:col-span-1">
              <div className="flex items-center gap-2 text-violet-200"><Sparkles className="size-4" aria-hidden="true" /><h3 className="text-sm font-semibold">{t('Your personalized insight', 'ข้อมูลเชิงลึกสำหรับคุณ')}</h3></div>
              <p className="mt-4 text-sm leading-6 text-slate-300">{recommendation}</p>
              <p className="mt-4 border-t border-white/[0.07] pt-3 text-[10px] leading-4 text-slate-500">{t('Generated from your current plan inputs. Review assumptions with a licensed financial professional.', 'สร้างจากข้อมูลแผนปัจจุบันของคุณ โปรดปรึกษาผู้เชี่ยวชาญด้านการเงินที่ได้รับใบอนุญาตเพื่อตรวจสอบสมมติฐาน')}</p>
            </article>
            <article className="rounded-2xl border border-white/[0.08] bg-[#0b1727]/85 p-5">
              <div className="flex items-center gap-2"><span className="grid size-8 place-items-center rounded-lg bg-cyan-300/10 text-cyan-300"><BookOpenCheck className="size-4" aria-hidden="true" /></span><div><p className="text-[10px] font-semibold uppercase tracking-wider text-cyan-300/80">{t('Build your next chapter', 'วางแผนบทต่อไปของชีวิต')}</p><h3 className="mt-0.5 text-sm font-semibold text-white">{t('Recommended longevity skills', 'ทักษะที่แนะนำสำหรับชีวิตที่ยืนยาว')}</h3></div></div>
              <div className="mt-4 rounded-xl border border-white/[0.06] bg-white/[0.025] p-3.5">
                <div className="flex items-start justify-between gap-3"><div><p className="text-sm font-medium text-slate-200">{t('Future-ready career toolkit', 'ชุดทักษะอาชีพพร้อมรับอนาคต')}</p><p className="mt-1 text-xs leading-5 text-slate-500">{t('Explore digital, consulting, and mentorship skills for a fulfilling post-retirement career.', 'เรียนรู้ทักษะดิจิทัล ที่ปรึกษา และการให้คำปรึกษา เพื่อสร้างอาชีพหลังเกษียณที่เติมเต็มชีวิต')}</p></div><ArrowUpRight className="size-4 shrink-0 text-slate-500" aria-hidden="true" /></div>
                <button type="button" className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-cyan-300 transition-colors hover:text-cyan-200">{t('Explore learning paths', 'สำรวจเส้นทางการเรียนรู้')}<ChevronRight className="size-3.5" aria-hidden="true" /></button>
              </div>
            </article>
            <article className="rounded-2xl border border-white/[0.08] bg-[#0b1727]/85 p-5">
              <div className="flex items-center gap-2"><span className="grid size-8 place-items-center rounded-lg bg-emerald-300/10 text-emerald-300"><BriefcaseBusiness className="size-4" aria-hidden="true" /></span><div><p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-300/80">{t('Explore your options', 'สำรวจทางเลือกของคุณ')}</p><h3 className="mt-0.5 text-sm font-semibold text-white">{t('Financial tools to consider', 'เครื่องมือทางการเงินที่ควรพิจารณา')}</h3></div></div>
              <div className="mt-4 rounded-xl border border-white/[0.06] bg-white/[0.025] p-3.5">
                <div className="flex items-start justify-between gap-3"><div><p className="text-sm font-medium text-slate-200">{t('Retirement & investment planning', 'การวางแผนเกษียณและการลงทุน')}</p><p className="mt-1 text-xs leading-5 text-slate-500">{t('Compare diversified investment and retirement planning options with a qualified advisor.', 'เปรียบเทียบทางเลือกการลงทุนที่หลากหลายและแผนเกษียณร่วมกับที่ปรึกษาที่มีคุณสมบัติเหมาะสม')}</p></div><ArrowRight className="size-4 shrink-0 text-slate-500" aria-hidden="true" /></div>
                <button type="button" className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-emerald-300 transition-colors hover:text-emerald-200">{t('View planning checklist', 'ดูรายการตรวจสอบแผนการเงิน')}<ChevronRight className="size-3.5" aria-hidden="true" /></button>
              </div>
              <p className="mt-3 text-[10px] text-slate-600">{t('Partner recommendations may be monetized in a future release.', 'คำแนะนำจากพันธมิตรอาจมีการสร้างรายได้ในเวอร์ชันถัดไป')}</p>
            </article>
          </div>
        </section>
        <footer className="mt-8 flex flex-col justify-between gap-2 border-t border-white/[0.07] pt-5 text-[10px] text-slate-600 sm:flex-row"><span>{t('Gen-Century Plan · A longevity planning prototype', 'Gen-Century Plan · ต้นแบบการวางแผนชีวิตยืนยาว')}</span><span>{t('Projections are illustrative and do not guarantee investment returns.', 'ตัวเลขประมาณการมีไว้เพื่อประกอบการศึกษา และไม่รับประกันผลตอบแทนจากการลงทุน')}</span></footer>
      </div>
    </main>
  )
}
