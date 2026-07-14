import type { ReactNode } from 'react'

// Responsive outer shell. Same children render in both modes; only the frame
// switches at the `md` breakpoint.
//   mobile (< md): full-viewport, edge-to-edge — it IS the app.
//   desktop (>= md): a phone-shaped device mockup centered on the paper page,
//                    so it reads clearly as a phone on a projector.
export function PhoneShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh w-full md:flex md:items-center md:justify-center md:py-8">
      {/* device frame — a real bezel only appears on desktop */}
      <div
        className={[
          'relative mx-auto flex w-full flex-col overflow-hidden bg-paper',
          'h-dvh', // mobile: full viewport height
          // desktop: fixed phone dimensions + ink bezel, no drop shadow (ink-on-paper)
          'md:h-[860px] md:max-h-[calc(100dvh-4rem)] md:w-[400px]',
          'md:rounded-[2.75rem] md:border-[10px] md:border-ink',
          'md:ring-1 md:ring-ink-20',
        ].join(' ')}
        style={{ contain: 'layout paint' }}
      >
        {/* notch — desktop only, decorative device cue */}
        <div className="pointer-events-none absolute left-1/2 top-0 z-30 hidden -translate-x-1/2 md:block">
          <div className="mt-2 h-5 w-32 rounded-full bg-ink" />
        </div>
        {children}
      </div>
    </div>
  )
}
