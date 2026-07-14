import { type ReactNode, useEffect, useRef, useState } from 'react'
import { useApp } from '../state/AppContext'
import { useSignalCapture } from '../signals/useSignalCapture'
import { assessTransfer } from '../lib/api'
import { type Beneficiary, IbanValidationError } from '../lib/types'
import { DEFAULT_CUSTOMER_REF, PURPOSE_PRESETS } from '../lib/seed'
import { maskIban } from '../lib/format'
import { cn } from '../lib/utils'
import { Kicker } from '../components/ui'

export function TransferScreen() {
  const { customer, prefill, demo, applyDecision, setReceipt } = useApp()
  const capture = useSignalCapture()

  const savedPayees = customer?.beneficiaries.filter((b) => b.saved) ?? []

  // 'saved' → pick a trusted on-file payee; 'new' → enter/paste an IBAN.
  const [mode, setMode] = useState<'saved' | 'new'>('saved')
  const [iban, setIban] = useState('')
  const [amount, setAmount] = useState('')
  const [purpose, setPurpose] = useState('')
  const [ibanError, setIbanError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Consume a demo-controls prefill. Still flows through the same capture code;
  // presentAsPasted marks the fields as pasted to demonstrate the coercion signal.
  const lastNonce = useRef<number | null>(null)
  useEffect(() => {
    if (!prefill || prefill.nonce === lastNonce.current) return
    lastNonce.current = prefill.nonce
    capture.reset()
    setIban(prefill.iban)
    setAmount(prefill.amount)
    setPurpose(prefill.purpose)
    setIbanError(null)
    setError(null)
    // Route the form into the right tab based on whether the prefilled IBAN is
    // an on-file (saved) payee. `saved` is NOT a risk signal — it only chooses
    // which entry path the demo lands on.
    const isSaved = savedPayees.some((p) => p.iban === prefill.iban)
    setMode(isSaved ? 'saved' : 'new')
    if (prefill.presentAsPasted) {
      capture.setEntryMethod('iban', 'pasted')
      capture.setEntryMethod('purpose', 'pasted')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefill, capture])

  // Truth comes from the live payload: a beneficiary is "new" unless it's an
  // on-file saved payee. This drives the isNewBeneficiary flag sent to the API.
  const trimmedIban = iban.trim().toUpperCase()
  const isNewBeneficiary = !savedPayees.some((p) => p.iban === trimmedIban)

  function pickSaved(b: Beneficiary) {
    capture.reset()
    setIban(b.iban)
    setIbanError(null)
    setError(null)
    // A tap on a trusted payee is a benign, typed-equivalent entry.
    capture.setEntryMethod('iban', 'typed')
  }

  const canSubmit = trimmedIban.length > 0 && amount.trim().length > 0 && !submitting

  async function submit() {
    setIbanError(null)
    setError(null)
    setSubmitting(true)
    const signals = capture.collect(demo)
    const beneficiaryIban = trimmedIban
    setReceipt({ amount: Number(amount), beneficiaryIban })
    try {
      const decision = await assessTransfer({
        eventId: `evt_${Date.now().toString(36)}`,
        customerRef: customer?.customerRef ?? DEFAULT_CUSTOMER_REF,
        transfer: {
          beneficiaryIban,
          amount: Number(amount),
          isNewBeneficiary,
          purpose: { text: purpose.trim() || 'سداد', entryMethod: capture.entry.purpose },
        },
        signals: {
          behavioral: signals.behavioral,
          coercion: { ...signals.coercion, ibanEntryMethod: capture.entry.iban },
        },
      })
      applyDecision(decision)
    } catch (e) {
      if (e instanceof IbanValidationError) {
        setIbanError('رقم آيبان غير صالح — يجب أن يبدأ بـ SA يتبعه 22 رقمًا.')
      } else {
        setError('تعذّر الاتصال بالخادم. تأكد من تشغيل خادم درع على المنفذ 8080.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const ibanPasted = capture.entry.iban === 'pasted'
  const purposePasted = capture.entry.purpose === 'pasted'

  return (
    <div className="anim-fade-up px-5 pb-8 pt-[calc(env(safe-area-inset-top)+1.35rem)] md:pt-9">
      <Kicker>تحويل جديد</Kicker>
      <h1 className="mt-2 font-display text-[22px] font-black tracking-tight text-ink">
        إلى مَن تُحوّل؟
      </h1>

      {/* Payee path — trusted (saved) vs new. `saved` picks the path only; it
          is never a risk cue, so nothing here is colored/flagged by it. */}
      <div className="mt-6">
        <FieldLabel>المستفيد</FieldLabel>
        <div className="mt-2 grid grid-cols-2 overflow-hidden rounded-[3px] border-r border-t border-ink">
          {(['saved', 'new'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setMode(m)
                setIban('')
                setIbanError(null)
                capture.reset()
              }}
              className={cn(
                'border-b border-l border-ink py-2.5 text-center text-[12.5px] transition-colors',
                mode === m ? 'bg-ink font-bold text-paper' : 'text-ink-70',
              )}
            >
              {m === 'saved' ? 'مستفيد موثوق' : 'مستفيد جديد'}
            </button>
          ))}
        </div>

        {mode === 'saved' ? (
          <div className="mt-3 border-b border-ink-12">
            {savedPayees.length === 0 ? (
              <p className="py-3 text-[12px] text-ink-40">لا يوجد مستفيدون محفوظون.</p>
            ) : (
              savedPayees.map((b, i) => {
                const selected = b.iban === trimmedIban
                return (
                  <button
                    key={b.iban}
                    type="button"
                    onClick={() => pickSaved(b)}
                    className="flex w-full items-center gap-3.5 border-t border-ink-12 py-3 text-right"
                  >
                    <span
                      className={cn(
                        'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border',
                        selected ? 'border-ink bg-ink' : 'border-ink-40',
                      )}
                    >
                      {selected && <span className="h-1.5 w-1.5 rounded-full bg-paper" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14.5px] font-bold text-ink">{b.name}</span>
                      <span className="mt-0.5 block truncate text-[11px] tracking-wide text-ink-40" dir="ltr">
                        {maskIban(b.iban)}
                      </span>
                    </span>
                    <span className="shrink-0 text-[9.5px] font-bold uppercase tracking-[0.14em] text-ink-55">
                      {b.relationship}
                    </span>
                    <span className="w-4 shrink-0 text-center text-[11px] font-bold text-ink-40 tnum">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                  </button>
                )
              })
            )}
          </div>
        ) : (
          <div className="mt-3">
            <input
              value={iban}
              dir="ltr"
              inputMode="text"
              autoCapitalize="characters"
              spellCheck={false}
              placeholder="SA00 0000 0000 0000 0000 0000"
              onChange={(e) => {
                setIban(e.target.value)
                capture.handlers.iban.onChange()
              }}
              onKeyDown={capture.handlers.iban.onKeyDown}
              onPaste={capture.handlers.iban.onPaste}
              className={cn(
                'w-full border-b bg-transparent py-2 text-right text-[15px] tnum tracking-wide outline-none',
                'placeholder:text-ink-40/50',
                ibanError ? 'border-oxblood' : 'border-ink focus:border-ink',
              )}
            />
            {ibanError && (
              <span className="mt-1.5 block text-xs font-semibold text-oxblood">{ibanError}</span>
            )}
          </div>
        )}
      </div>

      {/* Amount — the anchor */}
      <div className="mt-6">
        <FieldLabel>المبلغ · ريال</FieldLabel>
        <input
          value={amount}
          dir="ltr"
          inputMode="decimal"
          placeholder="0.00"
          onChange={(e) => {
            setAmount(e.target.value.replace(/[^\d.]/g, ''))
            capture.touch()
          }}
          className="mt-1 w-full border-b border-ink bg-transparent py-2 text-right text-[30px] font-bold tnum tracking-tight outline-none placeholder:text-ink-40/50"
        />
      </div>

      {/* Purpose — ruled segmented control + free text */}
      <div className="mt-6">
        <FieldLabel>الغرض</FieldLabel>
        <div className="mt-2 grid grid-cols-3 overflow-hidden rounded-[3px] border-r border-t border-ink">
          {PURPOSE_PRESETS.map((p) => {
            const active = purpose === p || (p === 'أخرى' && purpose === '')
            return (
              <button
                key={p}
                type="button"
                onClick={() => {
                  setPurpose(p === 'أخرى' ? '' : p)
                  capture.setEntryMethod('purpose', 'typed')
                }}
                className={cn(
                  'border-b border-l border-ink py-2.5 text-center text-[12px] transition-colors',
                  active ? 'bg-ink font-bold text-paper' : 'text-ink-70',
                )}
              >
                {p}
              </button>
            )
          })}
        </div>
        <input
          value={purpose}
          placeholder="أو اكتب الغرض بكلماتك"
          onChange={(e) => {
            setPurpose(e.target.value)
            capture.handlers.purpose.onChange()
          }}
          onKeyDown={capture.handlers.purpose.onKeyDown}
          onPaste={capture.handlers.purpose.onPaste}
          className="mt-3 w-full border-b border-ink bg-transparent py-2 text-[14px] outline-none placeholder:text-ink-40/50"
        />
      </div>

      {/* Telemetry strip — live proof of signal capture */}
      <div className="mt-7 border-b border-t-2 border-ink">
        <div className="flex items-center justify-between py-2.5">
          <Kicker>إشارات مُلتقطة</Kicker>
          <span className="flex items-center gap-1.5 text-[9px] font-bold tracking-[0.14em] text-green">
            <span className="h-1.5 w-1.5 rounded-full bg-green" /> مباشر
          </span>
        </div>
        <TeleRow k="إدخال الآيبان" v={ibanPasted ? 'ملصوق' : 'مكتوب'} warn={ibanPasted} />
        <TeleRow k="إدخال الغرض" v={purposePasted ? 'ملصوق' : 'مكتوب'} warn={purposePasted} />
        <TeleRow k="المستفيد" v={isNewBeneficiary ? 'جديد' : 'معتمد'} warn={isNewBeneficiary} />
        <TeleRow k="مكالمة نشطة" v={demo.activeCallDetected ? 'نعم' : 'لا'} warn={demo.activeCallDetected} />
        {demo.remoteAccessAppDetected && <TeleRow k="تطبيق وصول عن بُعد" v="نعم" warn />}
      </div>
      <p className="mt-2 text-[11px] leading-relaxed text-ink-40">
        يُقاس نمط الكتابة (cadence) فعليًا من ضغطات المفاتيح؛ قيم الإيقاع/الجهاز تقديرية في نسخة الويب.
      </p>

      {error && <p className="mt-4 text-sm font-semibold text-oxblood">{error}</p>}

      <button
        type="button"
        onClick={submit}
        disabled={!canSubmit}
        className="mt-6 w-full rounded-[3px] bg-ink py-4 text-center text-sm font-bold tracking-[0.08em] text-paper transition-opacity active:opacity-85 disabled:opacity-40"
      >
        {submitting ? 'جارٍ الفحص…' : 'متابعة التحويل'}
      </button>
    </div>
  )
}

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-ink-55">{children}</span>
  )
}

function TeleRow({ k, v, warn }: { k: string; v: string; warn?: boolean }) {
  return (
    <div className="flex items-center justify-between border-t border-ink-12 py-2 text-[12px]">
      <span className="text-ink-55">{k}</span>
      <span className={cn('flex items-center gap-1.5 font-bold tnum', warn ? 'text-oxblood' : 'text-ink')}>
        {v}
        <span className="text-[11px]">{warn ? '⚠' : '✓'}</span>
      </span>
    </div>
  )
}
