import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '../lib/utils'
import type { Decision } from '../lib/types'

// Editorial-ledger button: flat, crisp 3px corners, letterspaced. No shadow.
export function Button({
  className,
  variant = 'solid',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'solid' | 'ghost' | 'quiet' }) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-[3px] px-5 py-3.5 text-sm font-bold tracking-[0.06em]',
        'transition-colors duration-200 select-none active:opacity-80 disabled:opacity-40 disabled:pointer-events-none',
        variant === 'solid' && 'bg-ink text-paper',
        variant === 'ghost' && 'border border-ink text-ink bg-transparent',
        variant === 'quiet' && 'text-ink-70 bg-transparent',
        className,
      )}
      {...props}
    />
  )
}

// The Shield brand mark: a circled seal ( د) — replaces the shield glyph.
export function Seal({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full border-[1.5px] border-ink font-display font-black leading-none',
        'h-[30px] w-[30px] text-[13px]',
        className,
      )}
      aria-hidden
    >
      د
    </span>
  )
}

// Semantic state color, used sparingly (Shield moment + Intel telemetry only).
export const stateColor: Record<Decision, string> = {
  GREEN: 'text-green',
  ORANGE: 'text-ochre',
  RED: 'text-oxblood',
}
export const stateBg: Record<Decision, string> = {
  GREEN: 'bg-green',
  ORANGE: 'bg-ochre',
  RED: 'bg-oxblood',
}

const stateLabel: Record<Decision, string> = {
  GREEN: 'مسموح',
  ORANGE: 'مراجعة',
  RED: 'محظور',
}

// A small colored ink square set in the margin of an incident row.
export function StateMark({ decision, className }: { decision: Decision; className?: string }) {
  return <span className={cn('block h-2.5 w-2.5 shrink-0', stateBg[decision], className)} />
}

// State as an editorial label (colored, letterspaced) — no pill, no border.
export function StateBadge({ decision, label }: { decision: Decision; label?: string }) {
  return (
    <span className={cn('text-[11px] font-extrabold tracking-[0.06em]', stateColor[decision])}>
      {label ?? stateLabel[decision]}
    </span>
  )
}

export function Kicker({ children, center }: { children: ReactNode; center?: boolean }) {
  return <div className={cn('kicker', center && 'kicker-center')}>{children}</div>
}

export function Rule({ className }: { className?: string }) {
  return <div className={cn('rule', className)} />
}
