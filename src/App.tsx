import { useState } from 'react'
import { AppProvider, useApp } from './state/AppContext'
import { PhoneShell } from './components/PhoneShell'
import { AppHeader } from './components/AppHeader'
import { BottomNav } from './components/BottomNav'
import { DemoControls } from './components/DemoControls'
import { DemoFab } from './components/DemoFab'
import { HomeScreen } from './screens/HomeScreen'
import { TransferScreen } from './screens/TransferScreen'
import { InterventionChat } from './screens/InterventionChat'
import { SuccessScreen, BlockedScreen } from './screens/ResultScreens'
import { IntelDashboard } from './screens/IntelDashboard'
import { LockScreen } from './screens/LockScreen'

// The intervention chat and the result screens are immersive full-bleed spaces
// (their own headers / return actions, no nav). Home carries the editorial
// masthead; Transfer is a full-bleed "slip" with its own top spacing. Home and
// Transfer keep the bottom nav.
function PhoneApp() {
  const { view } = useApp()

  if (view === 'intervention') {
    return (
      <div className="flex h-full flex-col">
        <InterventionChat />
      </div>
    )
  }

  if (view === 'success' || view === 'blocked') {
    return (
      <div className="flex h-full flex-col" key={view}>
        {view === 'success' ? <SuccessScreen /> : <BlockedScreen />}
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      {view === 'home' && <AppHeader />}
      <main className="no-scrollbar flex-1 overflow-y-auto">
        {view === 'home' && <HomeScreen />}
        {view === 'transfer' && <TransferScreen />}
      </main>
      <BottomNav />
    </div>
  )
}

function Shell() {
  const { path } = useApp()
  const onIntel = path === '/intel'
  const [unlocked, setUnlocked] = useState(false)

  return (
    <PhoneShell>
      {unlocked ? (
        <>
          {onIntel ? (
            <div className="flex h-full flex-col">
              <div className="flex-1 overflow-hidden">
                <IntelDashboard />
              </div>
              <BottomNav />
            </div>
          ) : (
            <PhoneApp />
          )}
          <DemoFab />
          <DemoControls />
        </>
      ) : (
        <LockScreen onUnlock={() => setUnlocked(true)} />
      )}
    </PhoneShell>
  )
}

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  )
}
