'use client'

import { useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { Bot, Send, Sparkles, UserRound } from 'lucide-react'
import { MessageScroller } from '@shadcn/react/message-scroller'
import { Bubble, BubbleContent } from '@/components/ui/bubble'
import { Marker, MarkerContent } from '@/components/ui/marker'
import { Message, MessageAvatar, MessageContent, MessageHeader } from '@/components/ui/message'

type Language = 'en' | 'th'
type HealthStatus = 'excellent' | 'average' | 'at-risk'
type ChatMessage = { id: string; role: 'assistant' | 'user'; text: string }

type CenturyAiAdvisorProps = {
  career: string
  health: HealthStatus
  debt: number
  monthlyDebtPayment: number
  language: Language
}

const quickPrompts = [
  { en: 'How to handle my current debt?', th: 'จัดการหนี้ที่มีอยู่อย่างไรดี?' },
  { en: 'Top skills for my career in 10 years', th: 'ทักษะเด่นสำหรับอาชีพในอีก 10 ปี' },
  { en: 'How to hedge against medical inflation?', th: 'รับมือเงินเฟ้อค่ารักษาพยาบาลอย่างไร?' },
]

const money = (amount: number, language: Language) =>
  new Intl.NumberFormat(language === 'th' ? 'th-TH' : 'en-US', {
    style: 'currency',
    currency: 'THB',
    maximumFractionDigits: 0,
  }).format(amount)

function createAdvisorReply(question: string, context: CenturyAiAdvisorProps) {
  const isThai = context.language === 'th'
  const normalizedQuestion = question.toLowerCase()
  const asksAboutDebt = /debt|loan|repay|หนี้|เงินกู้|ชำระ/.test(normalizedQuestion)
  const asksAboutSkills = /skill|career|job|work|ทักษะ|อาชีพ|งาน/.test(normalizedQuestion)
  const asksAboutHealthcare = /medical|health|inflation|care|สุขภาพ|รักษา|เงินเฟ้อ/.test(normalizedQuestion)
  const healthLabel = isThai
    ? context.health === 'excellent' ? 'ดีเยี่ยม' : context.health === 'average' ? 'ปานกลาง' : 'มีความเสี่ยง'
    : context.health === 'excellent' ? 'excellent' : context.health === 'average' ? 'average' : 'at-risk'

  if (asksAboutDebt) {
    if (context.debt <= 0) {
      return isThai
        ? `จากข้อมูลตอนนี้ไม่มียอดหนี้ที่ต้องชำระ ลองคงเงินสำรองฉุกเฉินไว้ก่อนเพิ่มเงินลงทุน และตรวจสอบเครดิตเป็นระยะ แผนอาชีพ ${context.career} และสถานะสุขภาพ${healthLabel} ยังเป็นบริบทสำคัญในการกำหนดเงินสำรอง`
        : `Your profile currently shows no debt balance. Keep an emergency reserve before increasing investments, and review your credit regularly. Your ${context.career} career and ${healthLabel} health status still matter when choosing a comfortable reserve.`
    }
    return isThai
      ? `คุณระบุหนี้ ${money(context.debt, 'th')} และยอดชำระ ${money(context.monthlyDebtPayment, 'th')} ต่อเดือน ลองตรวจสอบ APR และค่าธรรมเนียมของหนี้แต่ละก้อน จ่ายขั้นต่ำให้ครบ แล้วพิจารณาเร่งจ่ายหนี้ดอกเบี้ยสูงก่อน โดยยังรักษาเงินสำรองที่เหมาะกับค่าใช้จ่ายจำเป็นไว้ รายได้จากสายงาน ${context.career} และสุขภาพ${healthLabel} อาจทำให้ระดับเงินสำรองที่สบายใจแตกต่างกัน`
      : `You reported ${money(context.debt, 'en')} in debt and a ${money(context.monthlyDebtPayment, 'en')} monthly repayment. Compare each balance’s APR and fees, cover all minimums, then consider prioritizing the highest-cost debt while keeping a reserve for essential expenses. Your ${context.career} income pattern and ${healthLabel} health status may change how large a reserve feels comfortable.`
  }

  if (asksAboutSkills) {
    const skillMap: Record<string, string> = {
      'Tech & AI Specialist': 'AI governance, cybersecurity, data literacy, and translating technical work into measurable business value',
      'Corporate & Business Manager': 'AI-enabled decision making, change leadership, financial fluency, and coaching cross-functional teams',
      'Healthcare & Medical Professional': 'digital health tools, care coordination, prevention, and communicating evidence clearly',
      'Creative, Media & Content Creator': 'AI-assisted production, audience analytics, rights management, and distinctive editorial judgment',
      'Government Officer & Civil Servant': 'digital public services, data-informed policy, privacy, and accessible communication',
      'Business Owner / SME Entrepreneur': 'cash-flow forecasting, digital sales, automation, and customer retention',
      'Freelance & Gig Economy Worker': 'portfolio diversification, client acquisition, pricing, and personal benefits planning',
      'Skilled Trades & Engineering': 'automation-aware diagnostics, safety, energy efficiency, and technical mentoring',
      'Educator & Academic Researcher': 'AI literacy, research communication, interdisciplinary collaboration, and lifelong learning design',
      'Student / Early-Career Starter': 'AI fluency, communication, practical portfolio projects, and adaptable problem solving',
    }
    const skills = skillMap[context.career] ?? 'digital literacy, communication, and practical problem solving'
    return isThai
      ? `สำหรับเส้นทาง ${context.career} ลองต่อยอดด้าน AI governance, data literacy, การสื่อสาร และการสร้างผลงานที่แสดงผลลัพธ์จริง เลือกทักษะหนึ่งด้านมาทดลองทำโปรเจกต์ภายใน 90 วัน โดยคำนึงถึงสุขภาพ${healthLabel}และภาระหนี้ ${money(context.debt, 'th')} ไปพร้อมกัน`
      : `For ${context.career}, build depth in ${skills}. Pick one skill and demonstrate it in a small portfolio project over the next 90 days. Keep the plan realistic alongside your ${healthLabel} health status and ${money(context.debt, 'en')} reported debt.`
  }

  if (asksAboutHealthcare) {
    return isThai
      ? `สุขภาพของคุณอยู่ในสถานะ${healthLabel} ลองทบทวนสิทธิประกันสุขภาพ ข้อยกเว้น ความคุ้มครองผู้ป่วยนอกและผู้ป่วยในทุกปี แยกเงินสำรองค่ารักษาจากเงินลงทุน และทดสอบแผนด้วยค่าใช้จ่ายที่เพิ่มขึ้น อย่าลืมพิจารณารายได้จากอาชีพ ${context.career} และภาระหนี้ ${money(context.debt, 'th')} ก่อนกำหนดจำนวนเงินสำรอง`
      : `With your ${healthLabel} health status, review coverage limits, exclusions, and outpatient versus inpatient benefits each year. Keep a medical reserve separate from long-term investments and stress-test it against rising costs. Factor in your ${context.career} income and ${money(context.debt, 'en')} reported debt before choosing a reserve target.`
  }

  return isThai
    ? `ฉันใช้โปรไฟล์จำลองของคุณ—อาชีพ ${context.career}, สุขภาพ${healthLabel}, หนี้ ${money(context.debt, 'th')}—เพื่อช่วยจัดกรอบคำถาม ลองเริ่มจากหนี้ เงินสำรองสุขภาพ หรือทักษะอาชีพที่อยากวางแผน แล้วตรวจสอบสมมติฐานกับผู้เชี่ยวชาญที่ได้รับใบอนุญาต`
    : `I’m using your simulated profile—${context.career}, ${healthLabel} health status, and ${money(context.debt, 'en')} reported debt—to frame the discussion. Ask about debt, healthcare reserves, or future career skills, and verify any assumptions with a qualified professional.`
}

export function CenturyAiAdvisor({ career, health, debt, monthlyDebtPayment, language }: CenturyAiAdvisorProps) {
  const isThai = language === 'th'
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: isThai
        ? 'สวัสดี ฉันช่วยสำรวจแนวคิดด้านการเงินและการวางแผนชีวิตยืนยาวตามโปรไฟล์จำลองของคุณได้ ลองเลือกคำถามหรือพิมพ์หัวข้อที่สนใจ'
        : 'Welcome. I can explore financial and longevity-planning ideas using your simulated profile. Choose a prompt or ask a question to get started.',
    },
  ])
  const [draft, setDraft] = useState('')
  const messageCounter = useRef(0)

  const sendQuestion = (question: string) => {
    const trimmedQuestion = question.trim()
    if (!trimmedQuestion) return
    messageCounter.current += 1
    const messageId = String(messageCounter.current)
    const response = createAdvisorReply(trimmedQuestion, { career, health, debt, monthlyDebtPayment, language })
    setMessages((current) => [
      ...current,
      { id: `user-${messageId}`, role: 'user', text: trimmedQuestion },
      { id: `advisor-${messageId}`, role: 'assistant', text: response },
    ])
    setDraft('')
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    sendQuestion(draft)
  }

  const preventCompositionSubmit = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && (event.nativeEvent.isComposing || event.keyCode === 229)) {
      event.preventDefault()
    }
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-violet-300/15 bg-gradient-to-br from-[#101b31] via-[#0b1727] to-[#11152d] shadow-[0_14px_50px_rgba(0,0,0,0.15)]" aria-labelledby="century-ai-heading">
      <header className="border-b border-white/[0.07] p-4">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-cyan-300/20 bg-cyan-300/[0.08] text-cyan-200 shadow-[0_0_22px_rgba(34,211,238,0.08)]">
            <Sparkles className="size-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 id="century-ai-heading" className="text-base font-semibold tracking-tight text-white">Century AI Advisor</h2>
            <span className="mt-1.5 inline-flex max-w-full items-center gap-1.5 rounded-full border border-violet-300/15 bg-violet-300/[0.07] px-2 py-1 text-[9px] font-medium leading-4 text-violet-200">
              <Sparkles className="size-3 shrink-0" aria-hidden="true" />
              <span>Specialized Longevity &amp; Finance AI Engine</span>
            </span>
          </div>
        </div>
      </header>

      <div className="p-4">
        <div className="mb-3 flex flex-col gap-2" aria-label={isThai ? 'คำถามแนะนำ' : 'Suggested questions'}>
          {quickPrompts.map((prompt) => {
            const label = isThai ? prompt.th : prompt.en
            return (
              <button
                key={prompt.en}
                type="button"
                onClick={() => sendQuestion(label)}
                className="w-fit max-w-full rounded-full border border-cyan-300/15 bg-cyan-300/[0.045] px-3 py-2 text-left text-[10px] leading-4 text-cyan-100/90 transition-colors hover:border-cyan-300/35 hover:bg-cyan-300/[0.09] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
              >
                {label}
              </button>
            )
          })}
        </div>

        <MessageScroller.Provider autoScroll defaultScrollPosition="end">
          <MessageScroller.Root className="relative min-h-0 w-full">
            <MessageScroller.Viewport
              aria-label={isThai ? 'บทสนทนากับ Century AI Advisor' : 'Century AI Advisor conversation'}
              className="h-[250px] min-h-0 overflow-y-auto overscroll-contain rounded-xl border border-white/[0.07] bg-[#07111f]/65 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
              tabIndex={0}
            >
              <MessageScroller.Content aria-live="polite" aria-relevant="additions" className="flex min-h-full flex-col gap-3 p-3">
                {messages.map((message, index) => (
                  <MessageScroller.Item key={message.id} messageId={message.id} scrollAnchor={index === messages.length - 1}>
                    <Message align={message.role === 'user' ? 'end' : 'start'} className="gap-2">
                      <MessageAvatar className={`grid size-7 min-w-7 shrink-0 place-items-center rounded-full ${message.role === 'user' ? 'bg-violet-300/10 text-violet-200' : 'bg-cyan-300/10 text-cyan-200'}`}>
                        {message.role === 'user' ? <UserRound className="size-3.5" aria-hidden="true" /> : <Bot className="size-3.5" aria-hidden="true" />}
                      </MessageAvatar>
                      <MessageContent className="max-w-[88%] gap-1.5">
                        <MessageHeader className="px-1 text-[9px] text-slate-500">
                          {message.role === 'user' ? (isThai ? 'คุณ' : 'You') : 'Century AI'}
                        </MessageHeader>
                        <Bubble align={message.role === 'user' ? 'end' : 'start'} variant={message.role === 'user' ? 'tinted' : 'muted'} className="max-w-full">
                          <BubbleContent className={`px-3 py-2 text-[11px] leading-5 ${message.role === 'user' ? 'border border-violet-300/10 bg-violet-300/10 text-violet-50' : 'border border-white/[0.06] bg-[#142338] text-slate-200'}`}>
                            {message.text}
                          </BubbleContent>
                        </Bubble>
                      </MessageContent>
                    </Message>
                  </MessageScroller.Item>
                ))}
              </MessageScroller.Content>
            </MessageScroller.Viewport>
          </MessageScroller.Root>
        </MessageScroller.Provider>

        <form onSubmit={handleSubmit} className="mt-3 flex items-center gap-2 rounded-xl border border-white/[0.1] bg-[#07111f]/80 p-1.5 transition-colors focus-within:border-cyan-300/45">
          <label className="sr-only" htmlFor="century-ai-question">{isThai ? 'พิมพ์คำถามของคุณ' : 'Type your question'}</label>
          <input
            id="century-ai-question"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={preventCompositionSubmit}
            placeholder={isThai ? 'ถามเรื่องการเงินหรืออายุยืน...' : 'Ask about money or longevity...'}
            maxLength={500}
            className="min-w-0 flex-1 bg-transparent px-2 py-2 text-xs text-white outline-none placeholder:text-slate-600"
          />
          <button
            type="submit"
            disabled={!draft.trim()}
            aria-label={isThai ? 'ส่งคำถาม' : 'Send question'}
            className="grid size-9 shrink-0 place-items-center rounded-lg bg-cyan-300 text-[#07111f] transition-colors hover:bg-cyan-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Send className="size-4" aria-hidden="true" />
          </button>
        </form>

        <Marker className="mt-3 items-start gap-1.5 text-[9px] leading-4 text-slate-500">
          <Sparkles className="mt-0.5 size-3 shrink-0 text-violet-300" aria-hidden="true" />
          <MarkerContent>
            {isThai
              ? 'การจำลองตอบตามโปรไฟล์โดยไม่ใช้โมเดล AI จริง ไม่ใช่คำแนะนำทางการเงิน'
              : 'Profile-based demo simulation, not a live AI model or financial advice.'}
          </MarkerContent>
        </Marker>
      </div>
    </section>
  )
}
