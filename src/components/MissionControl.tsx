import { memo, useState } from 'react'
import type { AgentVerdictInfo, SarInfo, LessonInfo, Decision, AgentStepInfo } from '../lib/types'
import { clsx } from 'clsx'

interface MissionControlProps {
  agents?: AgentVerdictInfo[]
  sar?: SarInfo
  lesson?: LessonInfo
  finalDecision: Decision
}

function decisionColor(d: Decision): string {
  switch (d) {
    case 'GREEN': return 'bg-emerald-100 text-emerald-800 border-emerald-300'
    case 'ORANGE': return 'bg-amber-100 text-amber-800 border-amber-300'
    case 'RED': return 'bg-red-100 text-red-800 border-red-300'
  }
}

function agentIcon(name: string): string {
  if (name.includes('Fraud')) return '🛡️'
  if (name.includes('Aml')) return '🔍'
  if (name.includes('Compliance')) return '📋'
  if (name.includes('Literacy')) return '📚'
  return '🤖'
}

function stepIcon(type: AgentStepInfo['type']): string {
  switch (type) {
    case 'THOUGHT': return '💭'
    case 'TOOL_CALL': return '🔧'
    case 'TOOL_RESULT': return '📊'
    case 'FINAL_ANSWER': return '✅'
  }
}

function truncate(s: string | null, max: number): string {
  if (!s) return ''
  return s.length <= max ? s : s.substring(0, max) + '...'
}

function ReasoningTrace({ steps }: { steps: AgentStepInfo[] }) {
  const [expanded, setExpanded] = useState(false)

  if (!steps || steps.length === 0) return null

  const visibleSteps = expanded ? steps : steps.slice(0, 4)

  return (
    <div className="mt-2 rounded-lg border border-stone-200 bg-stone-50 p-2">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-wide text-stone-500">
          Agent Reasoning Chain ({steps.length} steps)
        </span>
        {steps.length > 4 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-[10px] font-medium text-blue-600 hover:underline"
          >
            {expanded ? '▼ collapse' : `▶ show all ${steps.length}`}
          </button>
        )}
      </div>
      <div className="space-y-1">
        {visibleSteps.map((step, i) => (
          <div key={i} className="flex items-start gap-1.5 text-[11px]">
            <span className="mt-0.5 shrink-0">{stepIcon(step.type)}</span>
            <div className="min-w-0 flex-1">
              {step.type === 'TOOL_CALL' && (
                <div className="font-mono text-blue-700">
                  <span className="font-bold">{step.toolName}</span>
                  <span className="text-blue-500">({truncate(step.toolArguments, 60)})</span>
                </div>
              )}
              {step.type === 'TOOL_RESULT' && (
                <div className="text-stone-600">
                  <span className="font-bold text-stone-500">{step.toolName}:</span>{' '}
                  <span dir="auto">{truncate(step.content, 100)}</span>
                  {step.durationMs > 0 && (
                    <span className="ml-1 text-[9px] text-stone-400">{step.durationMs}ms</span>
                  )}
                </div>
              )}
              {step.type === 'THOUGHT' && (
                <div className="italic text-purple-600" dir="auto">{truncate(step.content, 120)}</div>
              )}
              {step.type === 'FINAL_ANSWER' && (
                <div className="rounded bg-green-50 px-1.5 py-0.5 font-mono text-[10px] text-green-700" dir="auto">
                  {truncate(step.content, 150)}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export const MissionControl = memo(function MissionControl({
  agents, sar, lesson, finalDecision,
}: MissionControlProps) {
  if (!agents || agents.length === 0) return null

  return (
    <div className="mission-control mt-4 rounded-xl border-2 border-stone-200 bg-stone-50 p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-lg">🎛️</span>
        <h3 className="text-sm font-bold text-stone-700">Mission Control — Multi-Agent Assessment</h3>
      </div>

      {/* Agent routing diagram */}
      <div className="mb-4 flex items-center gap-2 text-xs">
        <div className="rounded-lg bg-stone-700 px-3 py-1.5 font-bold text-white">MasterAgent</div>
        <span className="text-stone-400">→</span>
        <div className="flex flex-wrap gap-1.5">
          {agents.map((a, i) => (
            <div
              key={i}
              className={clsx(
                'rounded-lg border px-2.5 py-1 font-medium',
                decisionColor(a.decision),
              )}
            >
              {agentIcon(a.agent)} {a.agent}
            </div>
          ))}
        </div>
        <span className="text-stone-400">→</span>
        <div className={clsx('rounded-lg border px-3 py-1.5 font-bold', decisionColor(finalDecision))}>
          {finalDecision}
        </div>
      </div>

      {/* Per-agent verdicts with reasoning traces */}
      <div className="space-y-2">
        {agents.map((a, i) => (
          <div key={i} className="rounded-lg border border-stone-200 bg-white p-3">
            <div className="mb-1 flex items-center justify-between">
              <span className="font-bold text-stone-700">
                {agentIcon(a.agent)} {a.agent}
              </span>
              <div className="flex items-center gap-2">
                <span className={clsx('rounded px-2 py-0.5 text-xs font-bold', decisionColor(a.decision))}>
                  {a.decision}
                </span>
                {a.score > 0 && (
                  <span className="text-xs text-stone-500">score: {(a.score * 100).toFixed(0)}%</span>
                )}
              </div>
            </div>
            <p className="text-xs text-stone-600" dir="rtl">{a.evidence}</p>
            <p className="mt-1 text-[10px] font-mono text-stone-400">rule: {a.ruleId}</p>
            {a.trace && a.trace.length > 0 && <ReasoningTrace steps={a.trace} />}
          </div>
        ))}
      </div>

      {/* SAR draft */}
      {sar && (
        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3">
          <div className="mb-1 flex items-center gap-2">
            <span>📋</span>
            <span className="font-bold text-red-800">SAR Draft — {sar.sarId}</span>
            <span className="rounded bg-red-200 px-1.5 py-0.5 text-[10px] font-bold text-red-800">{sar.status}</span>
          </div>
          <p className="text-xs text-red-700" dir="rtl">{sar.narrative}</p>
        </div>
      )}

      {/* Just-in-time micro-lesson */}
      {lesson && (
        <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
          <div className="mb-1 flex items-center gap-2">
            <span>📚</span>
            <span className="font-bold text-emerald-800">Just-in-Time Lesson — {lesson.scamName}</span>
          </div>
          <p className="text-xs text-emerald-700" dir="rtl">{lesson.lesson}</p>
          {lesson.signs.length > 0 && (
            <ul className="mt-2 space-y-1" dir="rtl">
              {lesson.signs.map((s, i) => (
                <li key={i} className="text-xs text-emerald-600">⚠️ {s}</li>
              ))}
            </ul>
          )}
          <p className="mt-2 text-xs font-medium text-emerald-800" dir="rtl">✅ {lesson.action}</p>
          <p className="mt-1 text-[10px] text-emerald-400">
            Playbook now knows {lesson.playbookSize} patterns
          </p>
        </div>
      )}
    </div>
  )
})
