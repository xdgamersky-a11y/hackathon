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

type Language = 'en' | 'th'

type Inputs = {
  age: number
  savings: number
  monthly: number
  retirementAge: number
}

const initialInputs: Inputs = { age: 25, savings: 100_000, monthly: 10_000, retirementAge: 60 }
const currency = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 })
const tx = (language: Language, english: string, thai: string) => language === 'th' ? thai : english

function money(value: number, language: Language = 'en') {
  if (language === 'th') {
    if (value >= 1_000_000) return `฿${(value / 1_000_000).toFixed(value >= 100_000_000 ? 0 : 1)} ล้าน`
    return `${currency.format(Math.round(value))} บาท`
  }
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
  const [language, setLanguage] = useState<Language>('en')
  const t = (english: string, thai: string) => tx(language, english, thai)
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
        label: t('Total nominal wealth', 'มูลค่าทรัพย์สินตามตัวเลข'),
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
  }), [projection, language])

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
          label: (item) => ` ${item.dataset.label}: ${money(Number(item.raw), language)}`,
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
            return amount >= 1_000_000 ? t(`THB ${(amount / 1_000_000).toFixed(0)}m`, `${(amount / 1_000_000).toFixed(0)} ล้านบาท`) : t(`THB ${Math.round(amount / 1_000)}k`, `${Math.round(amount / 1_000)} พันบาท`)
          },
        },
      },
    },
  }), [language])

  const monthlyTarget = Math.max(0, inputs.savings * 0.05)
  const recommendation = inputs.monthly < monthlyTarget
    ? t(`You’re saving ${money(inputs.monthly, language)} each month. Increasing that by ${money(monthlyTarget - inputs.monthly, language)} could strengthen your long-term security. Small, consistent steps have a powerful effect over ${projection.yearsToRetirement} years.`, `คุณออมเงิน ${money(inputs.monthly, language)} ต่อเดือน การเพิ่มเงินออมอีก ${money(monthlyTarget - inputs.monthly, language)} จะช่วยเสริมความมั่นคงในระยะยาว การออมอย่างสม่ำเสมอแม้ทีละน้อยส่งผลดีได้ตลอด ${projection.yearsToRetirement} ปี`)
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
          <section className="rounded-2xl border border-white/[0.08] bg-[#0b1727]/85 p-5 shadow-[0_14px_50px_rgba(0,0,0,0.12)] sm:p-6" aria-labelledby="inputs-heading">
            <div className="flex items-center justify-between">
              <div><h2 id="inputs-heading" className="text-base font-semibold text-white">{t('Your starting point', 'ข้อมูลตั้งต้นของคุณ')}</h2><p className="mt-1 text-xs text-slate-500">{t('Adjust your plan in real time', 'ปรับแผนของคุณได้ทันที')}</p></div>
              <span className="rounded-lg border border-white/[0.08] bg-white/[0.035] px-2.5 py-1 text-[10px] font-medium text-slate-400">{t('THB · Thai baht', 'สกุลเงินบาท · THB')}</span>
            </div>
            <div className="mt-7 flex flex-col gap-7">
              <InputSlider label={t('Current age', 'อายุปัจจุบัน')} icon={CircleDollarSign} value={inputs.age} min={18} max={65} step={1} suffix={t('years', 'ปี')} onChange={(value) => setInputs((current) => ({ ...current, age: Math.min(value, current.retirementAge - 1) }))} />
              <InputSlider label={t('Current savings', 'เงินออมปัจจุบัน')} icon={Wallet} value={inputs.savings} min={0} max={5_000_000} step={10_000} suffix={t('THB', 'บาท')} format={(value) => currency.format(value)} onChange={(value) => update('savings', value)} />
              <InputSlider label={t('Monthly savings', 'เงินออมต่อเดือน')} icon={TrendingUp} value={inputs.monthly} min={0} max={100_000} step={1_000} suffix={t('THB / mo', 'บาท / เดือน')} format={(value) => currency.format(value)} onChange={(value) => update('monthly', value)} />
              <InputSlider label={t('Retirement target age', 'อายุเป้าหมายเกษียณ')} icon={BriefcaseBusiness} value={inputs.retirementAge} min={Math.max(30, inputs.age + 1)} max={75} step={1} suffix={t('years', 'ปี')} onChange={(value) => update('retirementAge', value)} />
            </div>
            <div className="mt-7 flex items-start gap-2.5 border-t border-white/[0.07] pt-4 text-[11px] leading-5 text-slate-500"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-cyan-400/70" aria-hidden="true" /><p>{t('Illustrative estimate assumes 6% annual growth and 2.5% inflation. This is not financial advice.', 'ตัวเลขประมาณการนี้สมมติผลตอบแทนเติบโต 6% ต่อปี และเงินเฟ้อ 2.5% ไม่ใช่คำแนะนำทางการเงิน')}</p></div>
          </section>

          <div className="min-w-0 space-y-5">
            <section className="rounded-2xl border border-white/[0.08] bg-[#0b1727]/85 p-5 shadow-[0_14px_50px_rgba(0,0,0,0.12)] sm:p-6" aria-labelledby="projection-heading">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div><h2 id="projection-heading" className="text-base font-semibold text-white">{t('Your 100-year wealth journey', 'เส้นทางความมั่งคั่งตลอด 100 ปี')}</h2><p className="mt-1 text-xs text-slate-500">{t('A long view, built one month at a time', 'มองภาพระยะยาว วางแผนทีละเดือน')}</p></div>
                <div className="flex flex-wrap gap-x-4 gap-y-2 text-[11px]">
                  <span className="flex items-center gap-2 text-slate-300"><span className="h-0.5 w-4 rounded bg-cyan-300" />{t('Nominal wealth', 'มูลค่าทรัพย์สิน')}</span>
                  <span className="flex items-center gap-2 text-slate-400"><span className="w-4 border-t-2 border-dashed border-violet-400" />{t('Inflation-adjusted', 'ปรับตามเงินเฟ้อ')}</span>
                </div>
              </div>
              <div className="mt-6 h-[255px] w-full sm:h-[300px]" role="img" aria-label={t(`Projected wealth from age ${inputs.age} through age 100. Nominal wealth at age 80 is ${money(projection.age80, language)}; inflation-adjusted value is ${money(projection.age80Real, language)}.`, `ประมาณการความมั่งคั่งตั้งแต่อายุ ${inputs.age} ถึง 100 ปี มูลค่าทรัพย์สินเมื่ออายุ 80 ปีคือ ${money(projection.age80, language)} และมูลค่าที่ปรับตามเงินเฟ้อคือ ${money(projection.age80Real, language)}`)}>
                <Line data={chartData} options={chartOptions} />
              </div>
            </section>
            <div className="grid gap-3 sm:grid-cols-3">
              <MetricCard label={t('Wealth at retirement', 'ความมั่งคั่งเมื่อเกษียณ')} value={money(projection.retirement, language)} detail={t(`At age ${inputs.retirementAge} · ${projection.yearsToRetirement} years from now`, `เมื่ออายุ ${inputs.retirementAge} · อีก ${projection.yearsToRetirement} ปี`)} icon={TrendingUp} />
              <MetricCard label={t('Wealth at age 80', 'ความมั่งคั่งเมื่ออายุ 80 ปี')} value={money(projection.age80, language)} detail={t(`${money(projection.age80Real, language)} in today’s money`, `${money(projection.age80Real, language)} ในมูลค่าเงินปัจจุบัน`)} icon={Wallet} tone="violet" />
              <MetricCard label={t('Inflation loss impact', 'ผลกระทบจากเงินเฟ้อ')} value={money(projection.age80 - projection.age80Real, language)} detail={t('Purchasing power difference at age 80', 'ส่วนต่างของกำลังซื้อเมื่ออายุ 80 ปี')} icon={ArrowDownRight} tone="amber" />
            </div>
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
