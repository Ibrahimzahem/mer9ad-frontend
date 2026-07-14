import { FlaskConical } from 'lucide-react'
import { useApp } from '../state/AppContext'

// A small, always-visible trigger for the demo-controls panel — so scenarios
// are reachable without the long-press / ?demo affordances. Hidden during the
// intervention chat and while the panel itself is open, to stay out of the way.
export function DemoFab() {
  const { view, demoOpen, setDemoOpen } = useApp()
  if (demoOpen || view === 'intervention') return null

  return (
    <button
      type="button"
      onClick={() => setDemoOpen(true)}
      aria-label="أدوات العرض"
      className="absolute bottom-[calc(env(safe-area-inset-bottom)+4.75rem)] left-4 z-30 flex items-center gap-1.5 rounded-[3px] border border-ink bg-paper px-2.5 py-1.5 text-[10px] font-bold tracking-[0.08em] text-ink shadow-none active:bg-ink active:text-paper"
    >
      <FlaskConical className="h-3.5 w-3.5" strokeWidth={1.75} />
      تجريبي
    </button>
  )
}
