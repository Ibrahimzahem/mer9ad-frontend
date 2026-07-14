import { useApp } from '../state/AppContext'
import type { Transaction } from '../lib/types'
import { formatDate, formatMoney } from '../lib/format'
import { Kicker, Seal } from '../components/ui'

export function HomeScreen() {
  const { customer, customerError, goTransfer } = useApp()

  if (!customer) {
    return (
      <div className="flex h-full items-center justify-center px-6 text-center text-[13px] text-ink-40">
        {customerError ? `تعذّر تحميل بيانات العميل: ${customerError}` : 'جارٍ تحميل الحساب…'}
      </div>
    )
  }

  const ibanTail = customer.iban.slice(-4)
  // newest first, most recent handful
  const recent = [...customer.transactions].reverse().slice(0, 6)

  return (
    <div className="anim-fade-up px-5 pb-6 pt-6">
      {/* balance — a ledger total */}
      <Kicker>الرصيد المتاح</Kicker>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="font-display text-[3.35rem] font-bold leading-[0.9] tracking-[-0.035em] text-ink tnum">
          {formatMoney(customer.balance)}
        </span>
        <span className="text-[15px] font-semibold text-ink-55">ريال سعودي</span>
      </div>
      <div className="ledger-rule mt-3.5">
        <i />
        <i />
      </div>
      <div className="mt-2.5 flex items-center justify-between text-[12px] text-ink-70">
        <span>حساب جارٍ — {customer.name}</span>
        <span className="font-semibold tnum" dir="ltr">
          ••{ibanTail}
        </span>
      </div>

      {/* primary action — ink bar */}
      <button
        type="button"
        onClick={goTransfer}
        className="mt-6 w-full rounded-[3px] bg-ink py-4 text-center text-sm font-bold tracking-[0.08em] text-paper active:opacity-85"
      >
        تحويل جديد
      </button>

      {/* recent transactions — a statement */}
      <div className="mt-8">
        <div className="flex items-baseline justify-between">
          <Kicker>أحدث العمليات</Kicker>
          <span className="text-[10px] font-semibold text-ink-40 tnum">
            {String(customer.transactions.length).padStart(2, '0')} عملية
          </span>
        </div>

        <div className="mt-3.5 border-b border-ink-12">
          {recent.map((t, i) => (
            <TxnRow key={`${t.date}-${t.iban}-${i}`} t={t} />
          ))}
        </div>
      </div>

      {/* colophon — printer's seal */}
      <div className="mt-8 flex items-start gap-3 border-t border-ink pt-3.5">
        <Seal />
        <div>
          <div className="font-display text-[12.5px] font-extrabold text-ink">محميّ بنظام درع</div>
          <p className="mt-0.5 text-[11.5px] leading-relaxed text-ink-55">
            نراقب الإكراه لحظة التحويل — لا الهوية.
          </p>
        </div>
      </div>
    </div>
  )
}

function TxnRow({ t }: { t: Transaction }) {
  const isIn = t.direction === 'IN'
  return (
    <div className="flex items-center gap-3.5 border-t border-ink-12 py-3 text-right">
      <span className="w-9 shrink-0 text-[10px] font-semibold leading-tight text-ink-40 tnum">
        {formatDate(t.date)}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[14px] font-bold text-ink">{t.counterparty}</span>
        <span className="mt-0.5 block truncate text-[10.5px] uppercase tracking-[0.12em] text-ink-40">
          {t.category}
        </span>
      </span>
      <span className="shrink-0 font-bold tnum text-[14px] text-ink" dir="ltr">
        {isIn ? '+' : '−'}
        {formatMoney(t.amount)}
      </span>
    </div>
  )
}
