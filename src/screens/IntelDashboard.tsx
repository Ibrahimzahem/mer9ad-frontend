import { useCallback, useEffect, useState } from 'react'
import { getFraudIntel, getScamPlaybook } from '../lib/api'
import type { AgentStepInfo, EntryMethod, FraudIntelRecord, FraudIntelTrace } from '../lib/types'
import { useApp } from '../state/AppContext'
import { formatTime, maskIban } from '../lib/format'
import { cn } from '../lib/utils'
import { Kicker, StateBadge, StateMark } from '../components/ui'

const POLL_MS = 4000

const outcomeLabel: Record<string, string> = {
  PROCEEDED_SAFE: 'مرّ بأمان',
  ABANDONED: 'أُلغي',
  BLOCKED: 'محظور (تمرير أموال)',
  CHALLENGE_FAILED: 'فشل التحقق',
  CHALLENGE_ISSUED: 'صدر تحدٍّ',
}

const entryLabel: Record<EntryMethod, string> = {
  typed: 'مكتوب',
  pasted: 'ملصوق',
  autofilled: 'معبّأ',
}

const stepLabel: Record<AgentStepInfo['type'], string> = {
  THOUGHT: 'تفكير',
  TOOL_CALL: 'استدعاء أداة',
  TOOL_RESULT: 'نتيجة',
  FINAL_ANSWER: 'الخلاصة',
}

// The docs promise `trace` is a flat, `step`-keyed array (matching
// agents[].trace on /api/transfer-intent). The live backend actually sends
// steps wrapped under `.steps` and keyed `stepNumber`. Accept either so
// rendering doesn't depend on which one is deployed at a given moment.
function normalizeTrace(trace: FraudIntelTrace | null): AgentStepInfo[] {
  if (!trace) return []
  const rawSteps = Array.isArray(trace) ? trace : trace.steps
  if (!rawSteps) return []
  return rawSteps.map((s, i) => ({
    step: s.step ?? s.stepNumber ?? i + 1,
    type: s.type,
    toolName: s.toolName,
    toolArguments: s.toolArguments,
    content: s.content,
    durationMs: s.durationMs,
  }))
}

export function IntelDashboard() {
  const { navigate } = useApp()
  const [intel, setIntel] = useState<FraudIntelRecord[]>([])
  const [playbook, setPlaybook] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [i, p] = await Promise.all([getFraudIntel(), getScamPlaybook()])
      setIntel(i)
      setPlaybook(p)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
    const id = window.setInterval(() => void load(), POLL_MS)
    return () => window.clearInterval(id)
  }, [load])

  const feed = [...intel].reverse() // newest first

  return (
    <div className="no-scrollbar flex h-full flex-col overflow-y-auto">
      {/* masthead */}
      <div className="sticky top-0 z-10 bg-paper px-5 pt-[calc(env(safe-area-inset-top)+1rem)] md:pt-9">
        <div className="flex items-end justify-between">
          <h1 className="font-display text-[21px] font-black tracking-tight text-ink">
            استخبارات الاحتيال
          </h1>
          <button
            type="button"
            onClick={() => void load()}
            className="rounded-[3px] border border-ink px-3 py-1.5 text-[10px] font-bold tracking-[0.06em] text-ink active:opacity-80"
          >
            تحديث {loading ? '…' : '↻'}
          </button>
        </div>
        <div className="mt-2.5 h-0.5 bg-ink" />
      </div>

      <div className="px-5 pb-24 pt-4">
        {error && (
          <p className="mb-3 border-r-[3px] border-oxblood bg-oxblood-soft px-3.5 py-2.5 text-sm text-oxblood">
            تعذّر الاتصال بالخادم: {error}
          </p>
        )}

        {/* Incident feed */}
        <div className="flex items-baseline justify-between">
          <Kicker>تغذية الحوادث</Kicker>
          <span className="text-[10px] font-semibold text-ink-40 tnum">{feed.length} سجلّ</span>
        </div>

        {feed.length === 0 ? (
          <p className="mt-3 border border-dashed border-ink-20 p-4 text-center text-sm text-ink-40">
            لا توجد سجلّات بعد. نفّذ تحويلاً برتقاليًا/أحمر ثم عُد.
          </p>
        ) : (
          <div className="mt-2">
            {feed.map((r, i) => (
              <IntelRow key={`${r.eventId}-${r.timestamp}-${i}`} r={r} />
            ))}
          </div>
        )}

        {/* Scam-script playbook */}
        <div className="mt-8">
          <Kicker>دليل أساليب الاحتيال</Kicker>
          <div className="mt-2">
            {playbook.map((pattern, i) => (
              <div key={i} className="flex gap-3 border-t border-ink-12 py-3">
                <span className="w-5 shrink-0 font-display text-[12px] font-extrabold text-ochre tnum">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <p className="text-[11.5px] leading-relaxed text-ink-70">{pattern}</p>
              </div>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate('/')}
          className="mt-8 text-sm font-bold tracking-[0.04em] text-ink-55"
        >
          ← العودة إلى التطبيق
        </button>
      </div>
    </div>
  )
}

function IntelRow({ r }: { r: FraudIntelRecord }) {
  const [expanded, setExpanded] = useState(false)
  const s = r.signalsSnapshot
  const steps = normalizeTrace(r.trace)
  const hasTrace = steps.length > 0
  const cells: [string, string, boolean?][] = [
    ['المبلغ', s.amount.toLocaleString('en-US')],
    ['عمر الحساب', `${s.beneficiaryAccountAgeDays} يوم`, s.beneficiaryAccountAgeDays <= 10],
    ['التمرير', s.beneficiaryTransitVelocity.toFixed(2), s.beneficiaryTransitVelocity >= 0.8],
    ['الغرض', entryLabel[s.purposeEntryMethod], s.purposeEntryMethod !== 'typed'],
    ['مكالمة', s.activeCallDetected ? 'نعم' : 'لا', s.activeCallDetected],
    ['قائمة', s.muleWatchlistHit ? 'نعم' : 'لا', s.muleWatchlistHit],
  ]

  return (
    <div className="flex gap-3 border-t border-ink-12 py-3.5">
      <StateMark decision={r.decision} className="mt-1" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <StateBadge decision={r.decision} />
          <span className="text-[11px] text-ink-40 tnum" dir="ltr">
            {formatTime(r.timestamp)}
          </span>
        </div>
        <div className="mt-1 text-[11px] text-ink-70" dir="ltr">
          {maskIban(r.beneficiaryIban)} — {outcomeLabel[r.outcome] ?? r.outcome}
        </div>

        <div className="mt-2.5 grid grid-cols-3 gap-x-2 gap-y-2">
          {cells.map(([k, v, warn]) => (
            <div key={k} className="min-w-0">
              <div className="text-[8.5px] text-ink-40">{k}</div>
              <div className={cn('truncate text-[11.5px] font-bold tnum', warn ? 'text-oxblood' : 'text-ink')}>
                {v}
              </div>
            </div>
          ))}
        </div>

        {r.detectedPattern && (
          <div className="mt-2.5 border-r-[3px] border-ochre bg-ochre-soft px-2.5 py-1.5 text-[11px] leading-snug text-ochre">
            نمط مُكتشَف: {r.detectedPattern}
          </div>
        )}

        {hasTrace && (
          <>
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="mt-2.5 flex items-center gap-1.5 text-[10.5px] font-bold tracking-[0.04em] text-ink-55 active:opacity-70"
            >
              <span className={cn('inline-block transition-transform duration-200', expanded && 'rotate-180')}>
                ▾
              </span>
              {expanded ? 'إخفاء تفكير الوكيل' : 'عرض تفكير الوكيل'}
            </button>
            {expanded && <ReasoningTrace steps={steps} />}
          </>
        )}
      </div>
    </div>
  )
}

// Same THOUGHT → TOOL_CALL → TOOL_RESULT → FINAL_ANSWER shape as
// DecisionResponse.agents[].trace — rendered in the feed's own ledger
// language instead of the Mission Control panel's judge-facing style.
function ReasoningTrace({ steps }: { steps: AgentStepInfo[] }) {
  return (
    <div className="anim-fade-up mt-2.5 border-t border-ink-12 pt-2">
      {steps.map((step, i) => (
        <div key={i} className="flex gap-2.5 py-1.5">
          <span className="w-4 shrink-0 pt-px text-[9px] font-bold text-ink-20 tnum" dir="ltr">
            {String(step.step).padStart(2, '0')}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-1.5">
              <span className="text-[8.5px] font-bold tracking-[0.06em] text-ink-40">
                {stepLabel[step.type]}
              </span>
              {step.toolName && (
                <span className="truncate font-mono text-[10px] text-ink-55" dir="ltr">
                  {step.toolName}
                </span>
              )}
              {step.durationMs > 0 && (
                <span className="mr-auto shrink-0 text-[9px] text-ink-20 tnum" dir="ltr">
                  {step.durationMs}ms
                </span>
              )}
            </div>
            {step.toolArguments && (
              <p className="mt-0.5 truncate font-mono text-[9.5px] text-ink-40" dir="ltr">
                {step.toolArguments}
              </p>
            )}
            {step.content && (
              <p
                className={cn(
                  'mt-0.5 text-[11px] leading-snug',
                  step.type === 'THOUGHT' && 'italic text-ink-55',
                  step.type === 'TOOL_RESULT' && 'text-ink-70',
                  step.type === 'FINAL_ANSWER' &&
                    'border-r-[3px] border-ochre bg-ochre-soft px-2 py-1 text-ochre',
                )}
                dir="auto"
              >
                {step.content}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
