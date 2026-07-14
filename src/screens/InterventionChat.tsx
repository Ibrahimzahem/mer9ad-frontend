import { useEffect, useRef, useState } from 'react'
import { useApp } from '../state/AppContext'
import { replyToIntervention } from '../lib/api'
import { Seal } from '../components/ui'
import { MissionControl } from '../components/MissionControl'

interface Msg {
  id: number
  role: 'shield' | 'user'
  text: string
}

// The grey-zone conversation. Deliberately unhurried: a typing pause precedes
// every Shield reply so the pace itself breaks manufactured urgency.
const THINK_MS = 1500

export function InterventionChat() {
  const { decision, resolveIntervention, resetAll } = useApp()
  const session = decision?.session

  const [messages, setMessages] = useState<Msg[]>(() =>
    session ? [{ id: 0, role: 'shield', text: session.question }] : [],
  )
  const [draft, setDraft] = useState('')
  const [thinking, setThinking] = useState(false)
  const [sending, setSending] = useState(false)
  const nextId = useRef(1)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, thinking])

  if (!session) return null

  async function send() {
    const answer = draft.trim()
    if (!answer || sending) return
    setDraft('')
    setSending(true)
    setMessages((m) => [...m, { id: nextId.current++, role: 'user', text: answer }])
    setThinking(true)

    const started = performance.now()
    try {
      const res = await replyToIntervention(session!.sessionId, answer)
      // enforce a minimum, deliberate pause before Shield "speaks"
      const elapsed = performance.now() - started
      if (elapsed < THINK_MS) await sleep(THINK_MS - elapsed)
      setThinking(false)

      if (res.action === 'RESOLVED' && res.finalDecision) {
        // let the last exchange settle before routing away
        setMessages((m) => [...m, { id: nextId.current++, role: 'shield', text: res.message }])
        await sleep(1400)
        resolveIntervention({ decision: res.finalDecision, message: res.message })
      } else {
        setMessages((m) => [...m, { id: nextId.current++, role: 'shield', text: res.message }])
      }
    } catch {
      setThinking(false)
      setMessages((m) => [
        ...m,
        {
          id: nextId.current++,
          role: 'shield',
          text: 'تعذّر الوصول إلى الخادم. حاول مرة أخرى.',
        },
      ])
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="anim-orange flex h-full flex-col bg-paper">
      {/* secure-conversation masthead */}
      <div className="shrink-0 px-5 pt-[calc(env(safe-area-inset-top)+1rem)] md:pt-9">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Seal />
            <div className="leading-none">
              <div className="font-display text-[15px] font-extrabold text-ink">محادثة آمنة</div>
              <div className="mt-1 text-[10px] font-semibold tracking-[0.18em] text-ink-55">
                درع · SHIELD
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={resetAll}
            className="rounded-[3px] border border-ink-20 px-3 py-1.5 text-[11px] font-bold text-ink-55 active:bg-ink-5"
          >
            إلغاء
          </button>
        </div>
        <p className="mt-3 text-[12px] leading-relaxed text-ink-70">
          توقّفنا للحظة قبل إتمام التحويل. خُذ وقتك — لا حاجة للعجلة.
        </p>
      </div>
      <div className="mx-5 mt-3 h-0.5 shrink-0 bg-ink" />

      {/* Agent mission control — shows what the agents found */}
      {decision?.agents && decision.agents.length > 0 && (
        <div className="no-scrollbar max-h-[40%] overflow-y-auto px-5">
          <MissionControl
            agents={decision.agents}
            finalDecision="ORANGE"
          />
        </div>
      )}

      {/* messages */}
      <div
        ref={scrollRef}
        className="no-scrollbar flex flex-1 flex-col gap-4 overflow-y-auto px-5 py-5"
      >
        {messages.map((m) =>
          m.role === 'shield' ? (
            <ShieldNote key={m.id} text={m.text} />
          ) : (
            <UserMsg key={m.id} text={m.text} />
          ),
        )}
        {thinking && <Typing />}
      </div>

      {/* composer */}
      <div className="shrink-0 border-t border-ink px-4 py-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
        <div className="flex items-end gap-2.5">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                void send()
              }
            }}
            rows={1}
            placeholder="اكتب ردّك بكلماتك أنت…"
            className="max-h-28 min-h-[40px] flex-1 resize-none border-b border-ink bg-transparent px-1 py-2 text-[15px] outline-none placeholder:text-ink-40/60"
          />
          <button
            type="button"
            onClick={() => void send()}
            disabled={!draft.trim() || sending}
            className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-[3px] bg-ink text-paper transition-opacity disabled:opacity-30"
            aria-label="إرسال"
          >
            <SendArrow />
          </button>
        </div>
      </div>
    </div>
  )
}

// Shield speaks as a typeset editor's note: text on paper with an ink
// margin-rule on the leading edge — no bubble.
function ShieldNote({ text }: { text: string }) {
  return (
    <div className="anim-bubble max-w-[90%] self-start border-r-2 border-ink pr-3.5">
      <div className="mb-1.5 flex items-center gap-1.5 text-[9.5px] font-bold tracking-[0.2em] text-ink-40">
        <span className="h-px w-3 bg-ink-40" />
        درع
      </div>
      <p className="text-[15px] leading-[1.75] text-ink">{text}</p>
    </div>
  )
}

// The customer replies as an ink-filled block, one corner softened.
function UserMsg({ text }: { text: string }) {
  return (
    <div className="anim-bubble max-w-[82%] self-end rounded-[3px] rounded-bl-xl bg-ink px-3.5 py-2.5 text-[14px] leading-relaxed text-paper">
      {text}
    </div>
  )
}

function Typing() {
  return (
    <div className="flex gap-1.5 self-start border-r-2 border-ink-40 pr-3.5 py-1">
      <span className="typing-dot h-1.5 w-1.5 rounded-full bg-ink-40" />
      <span className="typing-dot h-1.5 w-1.5 rounded-full bg-ink-40" style={{ animationDelay: '0.2s' }} />
      <span className="typing-dot h-1.5 w-1.5 rounded-full bg-ink-40" style={{ animationDelay: '0.4s' }} />
    </div>
  )
}

function SendArrow() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M8 13V3M8 3L3.5 7.5M8 3l4.5 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}
