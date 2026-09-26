'use client'

import { useMemo, useState } from 'react'
import {
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

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend)

type Inputs = {
  age: number
  savings: number
  monthly: number
  retirementAge: number
}

const initialInputs: Inputs = { age: 25, savings: 100_000, monthly: 10_000, retirementAge: 60 }
const currency = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 })

function money(value: number) {
  if (value >= 10_000_000) return `THB ${(value / 1_000_000).toFixed(value >= 100_000_000 ? 0 : 1)}m`
  if (value >= 1_000_000) return `THB ${(value / 1_000_000).toFixed(1)}m`
  return `THB ${currency.format(Math.round(value))}`
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
  const update = (key: keyof Inputs, value: number) => setInputs((current) => ({ ...current, [key]: value }))

  const projection = useMemo(() => {
    const years = Math.max(0, 100 - inputs.age)
    const labels = Array.from({ length: years + 1 }, (_, index) => inputs.age + index)
    const nominal = [inputs.savings]
    for (let year = 1; year <= years; year += 1) {
      nominal.push(nominal[year - 1] * 1.06 + inputs.monthly * 12)
    }
    const real = nominal.map((amount, index) => amount / Math.pow(1.025, index))
    const retirementIndex = Math.min(Math.max(0, inputs.retirementAge - inputs.age), years)
    const age80Index = Math.min(Math.max(0, 80 - inputs.age), years)
    return {
      labels,
      nominal,
      real,
      retirement: nominal[retirementIndex],
      age80: nominal[age80Index],
      age80Real: real[age80Index],
      yearsToRetirement: retirementIndex,
    }
  }, [inputs])

  const chartData = useMemo(() => ({
    labels: projection.labels,
    datasets: [
      {
        label: 'Total nominal wealth',
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
        label: 'Inflation-adjusted value',
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
  }), [projection])

  const chartOptions: ChartOptions<'line'> = useMemo(() => ({
    responsive: true,
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
          title: (items) => `Age ${items[0]?.label ?? ''}`,
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
          callback: (value) => {
            const amount = Number(value)
            return amount >= 1_000_000 ? `THB ${(amount / 1_000_000).toFixed(0)}m` : `THB ${Math.round(amount / 1_000)}k`
          },
        },
      },
    },
  }), [])

  const monthlyTarget = Math.max(0, inputs.savings * 0.05)
  const recommendation = inputs.monthly < monthlyTarget
    ? `You’re saving ${money(inputs.monthly)} each month. Increasing that by ${money(monthlyTarget - inputs.monthly)} could strengthen your long-term security. Small, consistent steps have a powerful effect over ${projection.yearsToRetirement} years.`
    : `Your monthly savings are building a strong foundation. With ${projection.yearsToRetirement} years until your target retirement, consider a yearly review to keep your plan aligned with the life you want to live.`

  return (
    <main className="min-h-screen overflow-hidden bg-[#07111f] text-slate-100">
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_50%_-15%,rgba(34,211,238,0.11),transparent_42%),radial-gradient(ellipse_at_100%_60%,rgba(124,58,237,0.09),transparent_35%)]" />
      <div className="relative mx-auto max-w-[1440px] px-4 pb-12 sm:px-7 lg:px-10">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.07] py-5">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl border border-cyan-300/20 bg-cyan-300/[0.09] text-cyan-300"><TrendingUp className="size-5" aria-hidden="true" /></div>
            <div>
              <p className="text-[15px] font-semibold tracking-tight text-white">Gen-Century Plan</p>
              <p className="mt-0.5 text-[11px] tracking-wide text-slate-500">YOUR 100-YEAR LIFE SIMULATOR</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[11px] sm:gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/[0.08] px-3 py-1.5 font-medium text-emerald-300"><BadgeCheck className="size-3.5" aria-hidden="true" />PDPA Compliant</span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.035] px-3 py-1.5 text-slate-400"><span className="size-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />Hardware Token Connected <span className="hidden text-slate-600 sm:inline">(#HK-2026-SECURED)</span></span>
          </div>
        </header>

        <section className="mt-6 flex flex-col justify-between gap-4 overflow-hidden rounded-2xl border border-cyan-300/15 bg-gradient-to-r from-[#0b2333] via-[#102034] to-[#171632] p-5 sm:flex-row sm:items-center sm:px-6 sm:py-5" aria-label="Hardware security simulator">
          <div className="flex items-start gap-4">
            <div className="grid size-11 shrink-0 place-items-center rounded-xl border border-cyan-200/15 bg-cyan-300/[0.08] text-cyan-300"><Fingerprint className="size-5" aria-hidden="true" /></div>
            <div>
              <p className="text-sm font-semibold text-white">Your future deserves a secure foundation</p>
              <p className="mt-1 max-w-xl text-xs leading-5 text-slate-400">Hardware-backed identity simulation with privacy-first planning. Your financial inputs stay in this browser.</p>
              {verified && <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-emerald-300"><Check className="size-3.5" aria-hidden="true" />Zero-Knowledge Encryption Active</p>}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setVerified((current) => !current)}
            aria-pressed={verified}
            className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300 ${verified ? 'border border-emerald-300/25 bg-emerald-300/10 text-emerald-200' : 'bg-cyan-300 text-[#07111f] shadow-[0_0_22px_rgba(34,211,238,0.16)] hover:bg-cyan-200'}`}
          >
            {verified ? <ShieldCheck className="size-4" aria-hidden="true" /> : <LockKeyhole className="size-4" aria-hidden="true" />}
            {verified ? 'Identity Verified' : 'Verify Identity with Hardware Device'}
          </button>
        </section>

        <div className="mb-5 mt-9 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300/80">Your financial future</p>
            <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-white sm:text-[30px]">Plan for the life ahead.</h1>
          </div>
          <p className="text-xs text-slate-500">A personal projection, from today through age 100</p>
        </div>

        <div className="grid items-start gap-5 xl:grid-cols-[340px_minmax(0,1fr)]">
          <section className="rounded-2xl border border-white/[0.08] bg-[#0b1727]/85 p-5 shadow-[0_14px_50px_rgba(0,0,0,0.12)] sm:p-6" aria-labelledby="inputs-heading">
            <div className="flex items-center justify-between">
              <div><h2 id="inputs-heading" className="text-base font-semibold text-white">Your starting point</h2><p className="mt-1 text-xs text-slate-500">Adjust your plan in real time</p></div>
              <span className="rounded-lg border border-white/[0.08] bg-white/[0.035] px-2.5 py-1 text-[10px] font-medium text-slate-400">THB · Thai baht</span>
            </div>
            <div className="mt-7 flex flex-col gap-7">
              <InputSlider label="Current age" icon={CircleDollarSign} value={inputs.age} min={18} max={65} step={1} suffix="years" onChange={(value) => setInputs((current) => ({ ...current, age: Math.min(value, current.retirementAge - 1) }))} />
              <InputSlider label="Current savings" icon={Wallet} value={inputs.savings} min={0} max={5_000_000} step={10_000} suffix="THB" format={(value) => currency.format(value)} onChange={(value) => update('savings', value)} />
              <InputSlider label="Monthly savings" icon={TrendingUp} value={inputs.monthly} min={0} max={100_000} step={1_000} suffix="THB / mo" format={(value) => currency.format(value)} onChange={(value) => update('monthly', value)} />
              <InputSlider label="Retirement target age" icon={BriefcaseBusiness} value={inputs.retirementAge} min={Math.max(30, inputs.age + 1)} max={75} step={1} suffix="years" onChange={(value) => update('retirementAge', value)} />
            </div>
            <div className="mt-7 flex items-start gap-2.5 border-t border-white/[0.07] pt-4 text-[11px] leading-5 text-slate-500"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-cyan-400/70" aria-hidden="true" /><p>Illustrative estimate assumes 6% annual growth and 2.5% inflation. This is not financial advice.</p></div>
          </section>

          <div className="min-w-0 space-y-5">
            <section className="rounded-2xl border border-white/[0.08] bg-[#0b1727]/85 p-5 shadow-[0_14px_50px_rgba(0,0,0,0.12)] sm:p-6" aria-labelledby="projection-heading">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div><h2 id="projection-heading" className="text-base font-semibold text-white">Your 100-year wealth journey</h2><p className="mt-1 text-xs text-slate-500">A long view, built one month at a time</p></div>
                <div className="flex flex-wrap gap-x-4 gap-y-2 text-[11px]">
                  <span className="flex items-center gap-2 text-slate-300"><span className="h-0.5 w-4 rounded bg-cyan-300" />Nominal wealth</span>
                  <span className="flex items-center gap-2 text-slate-400"><span className="w-4 border-t-2 border-dashed border-violet-400" />Inflation-adjusted</span>
                </div>
              </div>
              <div className="mt-6 h-[255px] w-full sm:h-[300px]" role="img" aria-label={`Projected wealth from age ${inputs.age} through age 100. Nominal wealth at age 80 is ${money(projection.age80)}; inflation-adjusted value is ${money(projection.age80Real)}.`}>
                <Line data={chartData} options={chartOptions} />
              </div>
            </section>
            <div className="grid gap-3 sm:grid-cols-3">
              <MetricCard label="Wealth at retirement" value={money(projection.retirement)} detail={`At age ${inputs.retirementAge} · ${projection.yearsToRetirement} years from now`} icon={TrendingUp} />
              <MetricCard label="Wealth at age 80" value={money(projection.age80)} detail={`${money(projection.age80Real)} in today’s money`} icon={Wallet} tone="violet" />
              <MetricCard label="Inflation loss impact" value={money(projection.age80 - projection.age80Real)} detail="Purchasing power difference at age 80" icon={ArrowDownRight} tone="amber" />
            </div>
          </div>
        </div>

        <section className="mt-9" aria-labelledby="insights-heading">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div><p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-300/80">Beyond the numbers</p><h2 id="insights-heading" className="mt-1.5 text-xl font-semibold tracking-tight text-white">Make your next century count.</h2></div>
            <span className="hidden items-center gap-1.5 rounded-full border border-violet-300/15 bg-violet-300/[0.07] px-3 py-1.5 text-[10px] font-medium text-violet-200 sm:inline-flex"><Sparkles className="size-3" aria-hidden="true" />PERSONALIZED FOR YOU</span>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <article className="rounded-2xl border border-violet-300/15 bg-gradient-to-br from-[#171732] to-[#101c30] p-5 lg:col-span-1">
              <div className="flex items-center gap-2 text-violet-200"><Sparkles className="size-4" aria-hidden="true" /><h3 className="text-sm font-semibold">Your personalized insight</h3></div>
              <p className="mt-4 text-sm leading-6 text-slate-300">{recommendation}</p>
              <p className="mt-4 border-t border-white/[0.07] pt-3 text-[10px] leading-4 text-slate-500">Generated from your current plan inputs. Review assumptions with a licensed financial professional.</p>
            </article>
            <article className="rounded-2xl border border-white/[0.08] bg-[#0b1727]/85 p-5">
              <div className="flex items-center gap-2"><span className="grid size-8 place-items-center rounded-lg bg-cyan-300/10 text-cyan-300"><BookOpenCheck className="size-4" aria-hidden="true" /></span><div><p className="text-[10px] font-semibold uppercase tracking-wider text-cyan-300/80">Build your next chapter</p><h3 className="mt-0.5 text-sm font-semibold text-white">Recommended longevity skills</h3></div></div>
              <div className="mt-4 rounded-xl border border-white/[0.06] bg-white/[0.025] p-3.5">
                <div className="flex items-start justify-between gap-3"><div><p className="text-sm font-medium text-slate-200">Future-ready career toolkit</p><p className="mt-1 text-xs leading-5 text-slate-500">Explore digital, consulting, and mentorship skills for a fulfilling post-retirement career.</p></div><ArrowUpRight className="size-4 shrink-0 text-slate-500" aria-hidden="true" /></div>
                <button type="button" className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-cyan-300 transition-colors hover:text-cyan-200">Explore learning paths<ChevronRight className="size-3.5" aria-hidden="true" /></button>
              </div>
            </article>
            <article className="rounded-2xl border border-white/[0.08] bg-[#0b1727]/85 p-5">
              <div className="flex items-center gap-2"><span className="grid size-8 place-items-center rounded-lg bg-emerald-300/10 text-emerald-300"><BriefcaseBusiness className="size-4" aria-hidden="true" /></span><div><p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-300/80">Explore your options</p><h3 className="mt-0.5 text-sm font-semibold text-white">Financial tools to consider</h3></div></div>
              <div className="mt-4 rounded-xl border border-white/[0.06] bg-white/[0.025] p-3.5">
                <div className="flex items-start justify-between gap-3"><div><p className="text-sm font-medium text-slate-200">Retirement & investment planning</p><p className="mt-1 text-xs leading-5 text-slate-500">Compare diversified investment and retirement planning options with a qualified advisor.</p></div><ArrowRight className="size-4 shrink-0 text-slate-500" aria-hidden="true" /></div>
                <button type="button" className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-emerald-300 transition-colors hover:text-emerald-200">View planning checklist<ChevronRight className="size-3.5" aria-hidden="true" /></button>
              </div>
              <p className="mt-3 text-[10px] text-slate-600">Partner recommendations may be monetized in a future release.</p>
            </article>
          </div>
        </section>
        <footer className="mt-8 flex flex-col justify-between gap-2 border-t border-white/[0.07] pt-5 text-[10px] text-slate-600 sm:flex-row"><span>Gen-Century Plan · A longevity planning prototype</span><span>Projections are illustrative and do not guarantee investment returns.</span></footer>
      </div>
    </main>
  )
}
