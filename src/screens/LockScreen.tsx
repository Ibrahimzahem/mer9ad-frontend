import { useCallback, useEffect, useState } from 'react'
import { cn } from '../lib/utils'
import { Seal } from '../components/ui'

// Demo passcode gate. Hardcoded 4-digit code; auto-submits on the 4th digit.
const PASSCODE = '1234'
const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'] as const

export function LockScreen({ onUnlock }: { onUnlock: () => void }) {
  const [code, setCode] = useState('')
  const [error, setError] = useState(false)

  const press = useCallback(
    (k: string) => {
      if (k === 'del') {
        setError(false)
        setCode((c) => c.slice(0, -1))
        return
      }
      if (!/^\d$/.test(k)) return
      setError(false)
      setCode((c) => (c.length >= 4 ? c : c + k))
    },
    [],
  )

  // Evaluate once four digits are in.
  useEffect(() => {
    if (code.length < 4) return
    if (code === PASSCODE) {
      const t = setTimeout(onUnlock, 160)
      return () => clearTimeout(t)
    }
    setError(true)
    const t = setTimeout(() => setCode(''), 500)
    return () => clearTimeout(t)
  }, [code, onUnlock])

  // Physical keyboard support (desktop demo).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') press(e.key)
      else if (e.key === 'Backspace') press('del')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [press])

  return (
    <div className="flex h-full flex-col items-center px-6 pt-[calc(env(safe-area-inset-top)+3rem)] pb-8">
      <Seal className="h-9 w-9 text-[15px]" />
      <div className="mt-4 font-display text-[22px] font-black tracking-tight text-ink">بنك المدى</div>
      <div className="mt-1.5 text-[10px] font-semibold tracking-[0.24em] text-ink-55">مؤمَّن بـ راصد</div>

      <p className="mt-9 text-[13px] text-ink-70">أدخل رمز الدخول</p>

      {/* code dots */}
      <div className={cn('mt-5 flex gap-4', error && 'anim-shake')}>
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={cn(
              'h-3 w-3 rounded-full border transition-colors',
              error ? 'border-oxblood' : 'border-ink',
              i < code.length && (error ? 'bg-oxblood' : 'bg-ink'),
            )}
          />
        ))}
      </div>

      <div className="h-5">
        {error && <p className="mt-2 text-[12px] font-semibold text-oxblood">رمز غير صحيح</p>}
      </div>

      {/* keypad — a ruled ledger grid */}
      <div className="mt-6 grid w-full max-w-[16rem] grid-cols-3 overflow-hidden rounded-[3px] border-r border-t border-ink">
        {KEYS.map((k, i) =>
          k === '' ? (
            <div key={i} className="border-b border-l border-ink" />
          ) : (
            <button
              key={i}
              type="button"
              onClick={() => press(k)}
              className="flex h-16 items-center justify-center border-b border-l border-ink font-display text-[22px] font-bold text-ink transition-colors active:bg-ink active:text-paper"
            >
              {k === 'del' ? <DelIcon /> : k}
            </button>
          ),
        )}
      </div>

      <p className="mt-auto text-[11px] text-ink-40">رمز العرض التجريبي: 1234</p>
    </div>
  )
}

function DelIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M9 6h9a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H9l-5-6 5-6Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="m11 10 4 4m0-4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}
