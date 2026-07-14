import type { ComponentType } from 'react'
import { cn } from '../lib/utils'
import { useApp } from '../state/AppContext'

// Editorial ruled footer. The active item is marked by a 2px ink top-border
// (a printed tab marker) rather than a filled/rounded chip.
export function BottomNav() {
  const { view, path, goHome, goTransfer, navigate } = useApp()

  const onIntel = path === '/intel'
  const items = [
    { key: 'home', label: 'الرئيسية', Icon: HomeIcon, active: !onIntel && view === 'home', onClick: goHome },
    { key: 'transfer', label: 'تحويل', Icon: TransferIcon, active: !onIntel && view === 'transfer', onClick: goTransfer },
    { key: 'menu', label: 'المركز', Icon: GridIcon, active: onIntel, onClick: () => navigate('/intel') },
  ]

  return (
    <nav className="shrink-0 border-t border-ink bg-paper pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-stretch">
        {items.map(({ key, label, Icon, active, onClick }) => (
          <button
            key={key}
            type="button"
            onClick={onClick}
            className={cn(
              'flex flex-1 flex-col items-center gap-1.5 py-2.5',
              active ? '-mt-px border-t-2 border-ink pt-[calc(0.625rem-1px)] text-ink' : 'text-ink-40',
            )}
          >
            <Icon active={active} />
            <span className={cn('text-[10px]', active ? 'font-bold' : 'font-medium')}>{label}</span>
          </button>
        ))}
      </div>
    </nav>
  )
}

type IconProps = { active?: boolean }
const sw = (active?: boolean) => (active ? 1.9 : 1.6)

const HomeIcon: ComponentType<IconProps> = ({ active }) => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
    <path
      d="M3.5 8.5 10 3.5l6.5 5M5 7.5V16h10V7.5"
      stroke="currentColor"
      strokeWidth={sw(active)}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

const TransferIcon: ComponentType<IconProps> = ({ active }) => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
    <path
      d="M4 7h11M12 4l3 3-3 3M16 13H5m3 3-3-3 3-3"
      stroke="currentColor"
      strokeWidth={sw(active)}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

const GridIcon: ComponentType<IconProps> = ({ active }) => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
    <rect x="3.5" y="3.5" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth={sw(active)} />
    <rect x="11" y="3.5" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth={sw(active)} />
    <rect x="3.5" y="11" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth={sw(active)} />
    <rect x="11" y="11" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth={sw(active)} />
  </svg>
)
