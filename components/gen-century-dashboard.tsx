"use client"

import { useMemo, useState } from "react"
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
  type TooltipItem,
} from "chart.js"
import { Line } from "react-chartjs-2"
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  BookOpen,
  BriefcaseBusiness,
  Check,
  ChevronDown,
  CircleHelp,
  Cpu,
  Fingerprint,
  GraduationCap,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  Wallet,
} from "lucide-react"

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend)

type Inputs = {
  age: number
  savings: number
  monthly: number
  retirementAge: number
}

type Projection = {
  age: number
  nominal: number
  real: number
}

const formatTHB = (value: number, compact = false) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 0,
    notation: compact ? "compact" : "standard",
  }).format(value)

const formatShort = (value: number) => {
  if (value >= 1_000_000_000) return `฿${(value / 1_000_000_000).toFixed(1)}B`
  if (value >= 1_000_000) return `฿${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `฿${Math.round(value / 1_000)}K`
  return formatTHB(value)
}

function projectWealth(inputs: Inputs): Projection[] {
  const monthlyRate = 0.06 / 12
  const inflationRate = 0.025
  let wealth = inputs.savings
  const projections: Projection[] = [{ age: inputs.age, nominal: wealth, real: wealth }]

  for (let month = 1; month <= (100 - inputs.age) * 12; month += 1) {
    const age = inputs.age + month / 12
    wealth *= 1 + monthlyRate
    if (age <= inputs.retirementAge) wealth += inputs.monthly
    if (month % 12 === 0) {
      const wholeAge = inputs.age + month / 12
      projections.push({
        age: wholeAge,
        nominal: wealth,
        real: wealth / Math.pow(1 + inflationRate, wholeAge - inputs.age),
      })
    }
  }
  return projections
}

function RangeField({
  label,
  value,
  min,
  max,
  step,
  onChange,
  displayValue,
  suffix,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (value: number) => void
  displayValue?: string
  suffix?: string
}) {
  const id = label.toLowerCase().replaceAll(" ", "-")
  return (
    <div className="range-field">
      <div className="range-field-top">
        <label htmlFor={id}>{label}</label>
        <span className="range-value">{displayValue ?? value.toLocaleString()}{suffix}</span>
      </div>
      <input
        id={id}
        aria-label={label}
        className="range-input"
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        style={{ "--range-progress": `${((value - min) / (max - min)) * 100}%` } as React.CSSProperties}
      />
      <div className="range-limits"><span>{min.toLocaleString()}</span><span>{max.toLocaleString()}</span></div>
    </div>
  )
}

function InputParameters({ inputs, onChange }: { inputs: Inputs; onChange: (key: keyof Inputs, value: number) => void }) {
  return (
    <section className="panel parameters-panel" aria-labelledby="parameters-title">
      <div className="panel-heading">
        <div className="section-icon cyan-icon"><Wallet size={17} /></div>
        <div>
          <h2 id="parameters-title">Your starting point</h2>
          <p>Adjust your plan to explore what's possible.</p>
        </div>
        <button className="icon-button help-button" aria-label="About your assumptions" title="Estimates assume a 6% annual return and 2.5% annual inflation."><CircleHelp size={16} /></button>
      </div>
      <div className="range-list">
        <RangeField label="Current age" value={inputs.age} min={18} max={Math.min(70, inputs.retirementAge - 1)} step={1} suffix=" years" onChange={(value) => onChange("age", value)} />
        <RangeField label="Current savings" value={inputs.savings} min={0} max={10_000_000} step={10_000} displayValue={formatTHB(inputs.savings)} onChange={(value) => onChange("savings", value)} />
        <RangeField label="Monthly savings" value={inputs.monthly} min={0} max={200_000} step={1_000} displayValue={formatTHB(inputs.monthly)} onChange={(value) => onChange("monthly", value)} />
        <RangeField label="Retirement age" value={inputs.retirementAge} min={inputs.age + 1} max={85} step={1} suffix=" years" onChange={(value) => onChange("retirementAge", value)} />
      </div>
      <div className="assumption-note">
        <span className="assumption-dot" />
        <span>Based on <strong>6% annual growth</strong> and <strong>2.5% inflation</strong></span>
      </div>
    </section>
  )
}

function ProjectionChart({ projections, retirementAge }: { projections: Projection[]; retirementAge: number }) {
  const data = useMemo(() => ({
    labels: projections.map(({ age }) => age),
    datasets: [
      {
        label: "Nominal wealth",
        data: projections.map(({ nominal }) => nominal),
        borderColor: "#35d5d0",
        backgroundColor: "rgba(53, 213, 208, 0.10)",
        borderWidth: 2.5,
        pointRadius: 0,
        pointHitRadius: 12,
        tension: 0.36,
        fill: true,
      },
      {
        label: "Today's purchasing power",
        data: projections.map(({ real }) => real),
        borderColor: "#a899ff",
        backgroundColor: "rgba(168, 153, 255, 0.06)",
        borderWidth: 2,
        borderDash: [5, 5],
        pointRadius: 0,
        pointHitRadius: 12,
        tension: 0.36,
        fill: false,
      },
    ],
  }), [projections])

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#101a27",
        borderColor: "rgba(145, 169, 193, .22)",
        borderWidth: 1,
        padding: 12,
        titleColor: "#dbe7f2",
        bodyColor: "#bdcad7",
        titleFont: { family: "Inter, sans-serif", size: 12, weight: "bold" },
        bodyFont: { family: "Inter, sans-serif", size: 12 },
        callbacks: {
          title: (items: TooltipItem<"line">[]) => `Age ${items[0]?.label ?? ""}`,
          label: (item: TooltipItem<"line">) => ` ${item.dataset.label}: ${formatTHB(Number(item.raw))}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: {
          color: "#728398",
          font: { family: "Inter, sans-serif", size: 10 },
          maxRotation: 0,
          autoSkip: false,
          callback: function (value) {
            const age = Number(this.getLabelForValue(Number(value)))
            return age % 10 === 0 || age === projections[0]?.age ? age : ""
          },
        },
      },
      y: {
        beginAtZero: true,
        border: { display: false, dash: [3, 5] },
        grid: { color: "rgba(145, 169, 193, .09)", tickLength: 0 },
        ticks: {
          color: "#728398",
          padding: 10,
          font: { family: "Inter, sans-serif", size: 10 },
          callback: (value) => formatShort(Number(value)),
          maxTicksLimit: 5,
        },
      },
    },
  }

  return (
    <div className="chart-wrap">
      <Line data={data} options={options} aria-label={`Projected wealth from age ${projections[0]?.age} to 100`} role="img" />
      <div className="retirement-marker" style={{ left: `${((retirementAge - (projections[0]?.age ?? retirementAge)) / (100 - (projections[0]?.age ?? 0))) * 100}%` }}>
        <span>Retirement {retirementAge}</span>
      </div>
    </div>
  )
}

function SummaryMetric({ label, value, caption, icon: Icon, accent, trend }: {
  label: string
  value: string
  caption: string
  icon: typeof Wallet
  accent: "cyan" | "violet" | "amber"
  trend?: "up" | "down"
}) {
  return (
    <article className="metric-card">
      <div className={`metric-icon ${accent}-metric`}><Icon size={16} /></div>
      <div className="metric-copy">
        <span className="metric-label">{label}</span>
        <strong className="metric-value">{value}</strong>
        <span className={`metric-caption ${trend === "up" ? "positive" : trend === "down" ? "negative" : ""}`}>
          {trend === "up" ? <ArrowUpRight size={12} /> : trend === "down" ? <ArrowDownRight size={12} /> : null}{caption}
        </span>
      </div>
    </article>
  )
}

function WealthProjection({ inputs, projections }: { inputs: Inputs; projections: Projection[] }) {
  const atAge = (age: number) => projections.find((item) => item.age === age) ?? projections[projections.length - 1]
  const atRetirement = atAge(inputs.retirementAge)
  const at80 = atAge(Math.max(80, inputs.age))
  const end = projections[projections.length - 1]
  const inflationLoss = Math.max(0, end.nominal - end.real)
  return (
    <section className="panel projection-panel" aria-labelledby="projection-title">
      <div className="chart-heading">
        <div>
          <div className="eyebrow">YOUR 100-YEAR OUTLOOK</div>
          <h2 id="projection-title">A longer view of your wealth</h2>
          <p>See how today's choices may grow across a lifetime.</p>
        </div>
        <span className="projection-tag"><span /> Projection</span>
      </div>
      <div className="chart-legend" aria-label="Chart legend">
        <span><i className="legend-line nominal-line" />Nominal wealth</span>
        <span><i className="legend-line real-line" />Today's purchasing power</span>
      </div>
      <ProjectionChart projections={projections} retirementAge={inputs.retirementAge} />
      <div className="metric-grid">
        <SummaryMetric label="Wealth at retirement" value={formatTHB(atRetirement?.nominal ?? 0, true)} caption={`At age ${inputs.retirementAge}`} icon={BriefcaseBusiness} accent="cyan" trend="up" />
        <SummaryMetric label="Wealth at age 80" value={formatTHB(at80?.nominal ?? 0, true)} caption="Projected nominal value" icon={Sparkles} accent="violet" trend="up" />
        <SummaryMetric label="Inflation impact by 100" value={`−${formatTHB(inflationLoss, true)}`} caption="In today's purchasing power" icon={ArrowDownRight} accent="amber" trend="down" />
      </div>
      <p className="disclaimer">Illustrative estimate only. Assumes steady returns, monthly contributions through retirement, and no withdrawals or taxes.</p>
    </section>
  )
}

function AdviceSection({ inputs, projection }: { inputs: Inputs; projection: Projection[] }) {
  const yearsToRetirement = inputs.retirementAge - inputs.age
  const retirementValue = projection.find((point) => point.age === inputs.retirementAge)?.nominal ?? 0
  const advice = yearsToRetirement > 25
    ? `You have ${yearsToRetirement} years until retirement — time is your greatest asset. Staying consistent with ${formatTHB(inputs.monthly)} a month could build a meaningful foundation before you reach 60.`.replace("reach 60", `reach ${inputs.retirementAge}`)
    : yearsToRetirement > 10
      ? `With ${yearsToRetirement} years to go, small increases can have a real impact. Consider raising your monthly contribution by 5% each year as your income grows.`
      : `Your retirement horizon is getting closer. Your model projects ${formatTHB(retirementValue, true)} at age ${inputs.retirementAge}; consider reviewing your risk balance and building a cash buffer.`
  const savingsTip = inputs.monthly < 15000
    ? "Explore a skills upgrade that can open a flexible second-career income stream later in life."
    : "Build on your momentum with digital skills that let you work flexibly at any age."
  return (
    <section className="insights-section" aria-labelledby="insights-title">
      <div className="insights-heading">
        <div className="eyebrow">PLAN FOR MORE THAN RETIREMENT</div>
        <h2 id="insights-title">A century of possibility</h2>
      </div>
      <div className="insight-grid">
        <article className="insight-card recommendation-card">
          <div className="insight-topline"><div className="insight-icon violet-icon"><Sparkles size={17} /></div><span className="ai-label">PERSONALIZED INSIGHT</span><span className="live-dot" /></div>
          <h3>Your next best move</h3>
          <p>{advice}</p>
          <div className="insight-footnote"><LockKeyhole size={13} /> Generated from your plan, privately</div>
        </article>
        <article className="insight-card action-card">
          <div className="insight-topline"><div className="insight-icon cyan-icon"><GraduationCap size={17} /></div><span className="action-kicker">LONGEVITY SKILLS</span></div>
          <h3>Keep your options open</h3>
          <p>{savingsTip}</p>
          <a className="text-link" href="https://www.coursera.org/" target="_blank" rel="noreferrer">Explore learning paths <ArrowRight size={14} /></a>
        </article>
        <article className="insight-card action-card">
          <div className="insight-topline"><div className="insight-icon amber-icon"><ShieldCheck size={17} /></div><span className="action-kicker">FINANCIAL TOOLKIT</span></div>
          <h3>Make your money work</h3>
          <p>Compare diversified funds, tax-advantaged savings, and protection for every life stage.</p>
          <a className="text-link" href="https://www.set.or.th/" target="_blank" rel="noreferrer">Explore financial tools <ArrowRight size={14} /></a>
        </article>
      </div>
      <p className="partner-disclosure">Educational resources only. Product links are illustrative and not financial advice.</p>
    </section>
  )
}

export default function GenCenturyDashboard() {
  const [inputs, setInputs] = useState<Inputs>({ age: 25, savings: 100_000, monthly: 10_000, retirementAge: 60 })
  const [verified, setVerified] = useState(false)
  const projections = useMemo(() => projectWealth(inputs), [inputs])

  const updateInput = (key: keyof Inputs, value: number) => {
    setInputs((current) => {
      if (key === "age") return { ...current, age: Math.min(value, current.retirementAge - 1) }
      if (key === "retirementAge") return { ...current, retirementAge: Math.max(value, current.age + 1) }
      return { ...current, [key]: value }
    })
  }

  return (
    <main className="dashboard-shell">
      <div className="ambient-glow ambient-one" aria-hidden="true" />
      <div className="ambient-glow ambient-two" aria-hidden="true" />
      <div className="dashboard-container">
        <header className="topbar">
          <a className="brand" href="#top" aria-label="Gen-Century Plan home">
            <span className="brand-mark"><span /><span /><span /></span>
            <span className="brand-name">gen<span>-</span>century <em>plan</em></span>
          </a>
          <div className="header-status">
            <span className="status-pill"><BadgeCheck size={14} /> PDPA compliant</span>
            <span className="device-pill"><Cpu size={14} /><span>Hardware token connected</span><b>#HK-2026-SECURED</b></span>
          </div>
          <button className="profile-button" aria-label="Open profile"><span>NP</span><ChevronDown size={13} /></button>
        </header>

        <section className="welcome-row" id="top">
          <div>
            <div className="eyebrow welcome-eyebrow"><span className="eyebrow-line" />YOUR FUTURE, IN FOCUS</div>
            <h1>Make room for <span>every chapter.</span></h1>
            <p>A clearer view of your finances — for the life you want to live at every age.</p>
          </div>
          <div className="user-greeting"><span className="greeting-avatar">N</span><div><span>YOUR PERSONAL PLAN</span><strong>Welcome back, Nicha</strong></div></div>
        </section>

        <section className={`security-banner ${verified ? "is-verified" : ""}`} aria-live="polite">
          <div className="security-art"><div className="security-orbit orbit-one" /><div className="security-orbit orbit-two" /><div className="security-lock"><Fingerprint size={21} /></div></div>
          <div className="security-copy">
            <div className="security-overline"><span className="security-live" />{verified ? "VERIFICATION COMPLETE" : "YOUR SECURITY, BUILT IN"}</div>
            <strong>{verified ? "Zero-Knowledge Encryption Active" : "Your future deserves a stronger key."}</strong>
            <span>{verified ? "Your identity is verified. Your financial data stays yours." : "Verify with your hardware device for a private, protected session."}</span>
          </div>
          <button className="verify-button" onClick={() => setVerified((value) => !value)} aria-pressed={verified}>
            {verified ? <><Check size={15} /> Device verified</> : <><ShieldCheck size={15} /> Verify identity <ArrowRight size={14} /></>}
          </button>
        </section>

        <div className="dashboard-grid">
          <InputParameters inputs={inputs} onChange={updateInput} />
          <WealthProjection inputs={inputs} projections={projections} />
        </div>

        <AdviceSection inputs={inputs} projection={projections} />

        <footer className="footer">
          <a className="brand footer-brand" href="#top"><span className="brand-mark"><span /><span /><span /></span><span className="brand-name">gen<span>-</span>century <em>plan</em></span></a>
          <span className="footer-note"><BookOpen size={13} /> A planning prototype for a longer life</span>
          <span className="footer-legal">Estimates are illustrative, not financial advice.</span>
        </footer>
      </div>
    </main>
  )
}

export { formatTHB }
