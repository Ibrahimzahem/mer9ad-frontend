import { useEffect, useState } from 'react'
import { useApp } from '../state/AppContext'
import { formatMoney, maskIban } from '../lib/format'
import { Kicker } from '../components/ui'

// A rotated ink stamp — the one expressive flourish, reserved for outcomes.
function Stamp({ text, tone }: { text: string; tone: 'green' | 'red' }) {
  const color = tone === 'green' ? 'text-green' : 'text-oxblood'
  const border = tone === 'green' ? 'border-green' : 'border-oxblood'
  return (
    <span
      className={`anim-stamp relative inline-block -rotate-[5deg] rounded-[6px] border-[2.5px] px-5 py-2 font-display text-[19px] font-black tracking-wide ${color} ${border}`}
    >
      {text}
      <span className={`pointer-events-none absolute inset-[4px] rounded-[3px] border ${border} opacity-50`} />
    </span>
  )
}

// GREEN — smooth success. Brief "processing" beat, then a stamped receipt.
export function SuccessScreen() {
  const { resolution, receipt, decision, resetAll } = useApp()
  const [done, setDone] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setDone(true), 1100)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="flex h-full flex-col pt-[calc(env(safe-area-inset-top)+1rem)]">
      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        {done ? (
          <>
            <Stamp text="تمّت الموافقة" tone="green" />
            <div className="mt-6">
              <Kicker center>أُتمَّ التحويل</Kicker>
            </div>
            <h1 className="mt-2 font-display text-[19px] font-extrabold text-ink">تمّ إرسال المبلغ</h1>
          </>
        ) : (
          <>
            <span className="typing-dot font-display text-[15px] font-bold tracking-[0.24em] text-ink-40">
              جارٍ المعالجة…
            </span>
          </>
        )}
        {done && resolution?.message && (
          <p className="mt-2.5 max-w-[16rem] text-[13.5px] leading-relaxed text-ink-70">
            {resolution.message}
          </p>
        )}
      </div>

      {done && (
        <>
          {receipt && (
            <div className="mx-6 border-b border-t-2 border-ink">
              <ReceiptRow k="المبلغ" v={`${formatMoney(receipt.amount)} ﷼`} />
              <ReceiptRow k="المستفيد" v={maskIban(receipt.beneficiaryIban)} />
              {decision?.decisionId && <ReceiptRow k="المرجع" v={decision.decisionId} last />}
            </div>
          )}
          <button
            type="button"
            onClick={resetAll}
            className="anim-fade-up mx-6 mb-6 mt-6 rounded-[3px] border border-ink py-3.5 text-center text-sm font-bold tracking-[0.06em] text-ink active:opacity-80"
          >
            العودة إلى الرئيسية
          </button>
        </>
      )}
    </div>
  )
}

function ReceiptRow({ k, v, last }: { k: string; v: string; last?: boolean }) {
  return (
    <div className={`flex items-center justify-between py-2.5 text-[12px] ${last ? '' : 'border-b border-ink-12'}`}>
      <span className="text-ink-55">{k}</span>
      <span className="font-bold tnum" dir="ltr">
        {v}
      </span>
    </div>
  )
}

// RED — a firm, calm block. Stamp + coercion aside + report reference + mission control.
export function BlockedScreen() {
  const { resolution, resetAll } = useApp()

  return (
    <div className="anim-fade-up flex h-full flex-col overflow-y-auto px-6 pb-6 pt-[calc(env(safe-area-inset-top)+3.5rem)]">
      <div className="flex flex-col items-center text-center">
        <Stamp text="أُوقِف التحويل" tone="red" />
        <div className="mt-6">
          <Kicker center>حِماية</Kicker>
        </div>
        <h1 className="mt-2 font-display text-[19px] font-extrabold text-oxblood">
          أوقفنا هذا التحويل لحمايتك
        </h1>
        {resolution?.message && (
          <p className="mt-2.5 max-w-[16rem] text-[13.5px] leading-relaxed text-ink-90">
            {resolution.message}
          </p>
        )}
      </div>

      {/* coercion-awareness aside — a margin-ruled note */}
      <div className="mt-7 border-r-[3px] border-oxblood bg-oxblood-soft px-3.5 py-3">
        <div className="font-display text-[12.5px] font-extrabold text-oxblood">
          إذا كان أحدٌ يوجّهك الآن
        </div>
        <p className="mt-1 text-[12px] leading-relaxed text-ink-70">
          إن طلب منك شخصٌ عبر الهاتف إتمام هذا التحويل أو كتابة غرضٍ معيّن، فمن المرجّح أنه محتال.
          أنهِ المكالمة واتصل بالبنك عبر رقمه الرسمي.
        </p>
      </div>

      {resolution?.reportReference && (
        <div className="mt-4 flex items-center justify-between border-t border-ink-12 pt-3 text-[11px] text-ink-55">
          <span>رقم البلاغ</span>
          <span className="font-bold tnum text-ink" dir="ltr">
            {resolution.reportReference}
          </span>
        </div>
      )}

      <div className="flex-1" />
      <button
        type="button"
        onClick={resetAll}
        className="mt-8 rounded-[3px] border border-ink py-3.5 text-center text-sm font-bold tracking-[0.06em] text-ink active:opacity-80"
      >
        العودة إلى الرئيسية
      </button>
    </div>
  )
}
