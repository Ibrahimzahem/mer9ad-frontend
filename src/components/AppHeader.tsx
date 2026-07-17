import { useRef } from 'react'
import { useApp } from '../state/AppContext'

// Editorial masthead: bank nameplate + newspaper dateline, capped by a heavy
// double rule. Replaces the old faux status bar (clock/wifi/battery).
// Long-pressing the nameplate opens the discreet demo-controls panel.
export function AppHeader() {
  const { setDemoOpen } = useApp()
  const timer = useRef<number | null>(null)

  const startPress = () => {
    timer.current = window.setTimeout(() => setDemoOpen(true), 550)
  }
  const cancelPress = () => {
    if (timer.current) window.clearTimeout(timer.current)
    timer.current = null
  }

  return (
    <div className="shrink-0 bg-paper pt-[calc(env(safe-area-inset-top)+0.85rem)] md:pt-8">
      <div className="flex items-end justify-between px-5">
        <button
          type="button"
          onPointerDown={startPress}
          onPointerUp={cancelPress}
          onPointerLeave={cancelPress}
          onContextMenu={(e) => e.preventDefault()}
          className="select-none text-right leading-none"
          aria-label="بنك المدى — اضغط مطولاً لأدوات العرض"
        >
          <div className="font-display text-[23px] font-black tracking-tight text-ink">
            بنك المدى
          </div>
          <div className="mt-1.5 text-[10px] font-semibold tracking-[0.24em] text-ink-55">
            مؤمَّن بـ راصد
          </div>
        </button>

        <div className="text-left text-[10px] font-semibold leading-[1.5] tracking-[0.1em] text-ink-40">
          {weekday()}
          <br />
          {dateLine()}
        </div>
      </div>

      <div className="mast-rule mt-3 px-5">
        <i />
        <i />
      </div>
    </div>
  )
}

// Arabic weekday + Gregorian date with Arabic-Indic numerals.
function weekday(): string {
  return new Date().toLocaleDateString('ar-u-ca-gregory', { weekday: 'long' })
}
function dateLine(): string {
  return new Date().toLocaleDateString('ar-u-ca-gregory', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}
