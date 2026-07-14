import type { ReactNode } from 'react'
import { PhoneCall, RotateCcw, ScreenShare, X } from 'lucide-react'
import { useApp } from '../state/AppContext'
import { DEMO_SCENARIOS } from '../lib/seed'
import { cn } from '../lib/utils'
import { Button, Kicker } from './ui'

// Discreet demo panel (long-press the nameplate, or the ?demo query param).
// Pick a seeded scenario by REAL iban, toggle the two non-browser signals,
// and reset. Selecting a scenario still routes through real signal capture.
// Note: the marker color groups scenarios by their *expected* outcome — it is
// a demo convenience, not a claim the app makes about any account.
export function DemoControls() {
  const { demoOpen, setDemoOpen, selectScenario, demo, setDemo, resetAll } = useApp()
  if (!demoOpen) return null

  return (
    <div className="absolute inset-0 z-40 flex flex-col justify-end">
      {/* scrim */}
      <button
        type="button"
        aria-label="إغلاق"
        onClick={() => setDemoOpen(false)}
        className="absolute inset-0 bg-ink/40"
      />
      {/* sheet */}
      <div className="anim-fade-up relative max-h-[88%] overflow-y-auto rounded-t-[4px] border-t-2 border-ink bg-paper px-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] pt-4">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-ink-20" />
        <div className="flex items-center justify-between">
          <div>
            <Kicker>أدوات العرض</Kicker>
            <h2 className="mt-1 font-display text-xl font-bold text-ink">اختر سيناريو</h2>
          </div>
          <button type="button" onClick={() => setDemoOpen(false)} aria-label="إغلاق">
            <X className="h-6 w-6 text-ink-55" />
          </button>
        </div>

        {/* scenario picker */}
        <div className="mt-4 border-b border-ink-12">
          {DEMO_SCENARIOS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => selectScenario(s.id)}
              className="flex w-full items-center gap-3 border-t border-ink-12 py-3 text-right transition-colors active:bg-paper-soft"
            >
              <span
                className={cn(
                  'h-2.5 w-2.5 shrink-0',
                  s.tone === 'GREEN' && 'bg-green',
                  s.tone === 'ORANGE' && 'bg-ochre',
                  s.tone === 'RED' && 'bg-oxblood',
                )}
              />
              <span className="min-w-0 flex-1">
                <span className="block text-[14px] font-bold text-ink">{s.title}</span>
                <span className="block text-[11.5px] text-ink-55">{s.sub}</span>
              </span>
              <span className="shrink-0 text-[10px] text-ink-40 tnum" dir="ltr">
                ••{s.iban.slice(-4)}
              </span>
            </button>
          ))}
        </div>

        {/* toggles */}
        <div className="mt-5">
          <Kicker>إشارات غير قابلة للكشف في المتصفح</Kicker>
          <div className="mt-2 space-y-2">
            <Toggle
              icon={<PhoneCall className="h-4 w-4" />}
              label="مكالمة نشطة أثناء التحويل"
              value={demo.activeCallDetected}
              onChange={(v) => setDemo({ activeCallDetected: v })}
            />
            <Toggle
              icon={<ScreenShare className="h-4 w-4" />}
              label="تطبيق وصول عن بُعد"
              value={demo.remoteAccessAppDetected}
              onChange={(v) => setDemo({ remoteAccessAppDetected: v })}
            />
          </div>
        </div>

        <Button variant="ghost" className="mt-5 w-full" onClick={resetAll}>
          <RotateCcw className="h-4 w-4" /> إعادة ضبط الحالة
        </Button>
      </div>
    </div>
  )
}

function Toggle({
  icon,
  label,
  value,
  onChange,
}: {
  icon: ReactNode
  label: string
  value: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className="flex w-full items-center gap-3 rounded-[3px] border border-ink-20 px-4 py-3 text-right"
    >
      <span className={cn('shrink-0', value ? 'text-ochre' : 'text-ink-40')}>{icon}</span>
      <span className="flex-1 text-[14px] font-medium text-ink">{label}</span>
      <span
        className={cn(
          'relative h-6 w-11 shrink-0 rounded-full transition-colors',
          value ? 'bg-ochre' : 'bg-ink-20',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 h-5 w-5 rounded-full bg-paper transition-all',
            value ? 'left-0.5' : 'right-0.5',
          )}
        />
      </span>
    </button>
  )
}
