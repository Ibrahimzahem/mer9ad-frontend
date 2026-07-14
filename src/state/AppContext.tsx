import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { getAccounts, getCustomer } from '../lib/api'
import { DEMO_SCENARIOS } from '../lib/seed'
import type { Account, Customer, DecisionResponse } from '../lib/types'

export type PhoneView = 'home' | 'transfer' | 'intervention' | 'success' | 'blocked'

export interface Resolution {
  decision: 'GREEN' | 'RED'
  message: string
  reportReference?: string
}

export interface Prefill {
  iban: string
  amount: string
  purpose: string
  presentAsPasted: boolean
  nonce: number
}

// A truthful snapshot of the submitted transfer, so the success receipt shows
// the real amount + beneficiary (the API response does not echo them back).
export interface Receipt {
  amount: number
  beneficiaryIban: string
}

interface DemoToggles {
  activeCallDetected: boolean
  remoteAccessAppDetected: boolean
}

interface AppState {
  // data — the whole demo user, loaded live from GET /api/customer
  customer: Customer | null
  customerError: string | null
  accounts: Account[]
  accountsError: string | null
  // routing
  path: string
  navigate: (path: string) => void
  // phone view machine
  view: PhoneView
  goHome: () => void
  goTransfer: () => void
  // demo controls
  demo: DemoToggles
  setDemo: (patch: Partial<DemoToggles>) => void
  prefill: Prefill | null
  selectScenario: (scenarioId: string) => void
  demoOpen: boolean
  setDemoOpen: (open: boolean) => void
  // decision + intervention outcomes
  decision: DecisionResponse | null
  applyDecision: (d: DecisionResponse) => void
  resolution: Resolution | null
  resolveIntervention: (r: Resolution) => void
  receipt: Receipt | null
  setReceipt: (r: Receipt) => void
  resetAll: () => void
}

const Ctx = createContext<AppState | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [customerError, setCustomerError] = useState<string | null>(null)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [accountsError, setAccountsError] = useState<string | null>(null)

  const [path, setPath] = useState<string>(
    typeof window === 'undefined' ? '/' : window.location.pathname,
  )
  const [view, setView] = useState<PhoneView>('home')
  const [demo, setDemoState] = useState<DemoToggles>({
    activeCallDetected: false,
    remoteAccessAppDetected: false,
  })
  const [prefill, setPrefill] = useState<Prefill | null>(null)
  const [demoOpen, setDemoOpen] = useState<boolean>(
    typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('demo'),
  )
  const [decision, setDecision] = useState<DecisionResponse | null>(null)
  const [resolution, setResolution] = useState<Resolution | null>(null)
  const [receipt, setReceipt] = useState<Receipt | null>(null)

  useEffect(() => {
    getCustomer()
      .then(setCustomer)
      .catch((e: unknown) => setCustomerError(e instanceof Error ? e.message : String(e)))
    getAccounts()
      .then(setAccounts)
      .catch((e: unknown) => setAccountsError(e instanceof Error ? e.message : String(e)))
  }, [])

  // history-based routing for '/' vs '/intel'
  useEffect(() => {
    const onPop = () => setPath(window.location.pathname)
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const navigate = useCallback((to: string) => {
    if (typeof window !== 'undefined' && window.location.pathname !== to) {
      window.history.pushState({}, '', to)
    }
    setPath(to)
  }, [])

  const setDemo = useCallback((patch: Partial<DemoToggles>) => {
    setDemoState((d) => ({ ...d, ...patch }))
  }, [])

  const goHome = useCallback(() => {
    navigate('/')
    setView('home')
  }, [navigate])

  const goTransfer = useCallback(() => {
    navigate('/')
    setView('transfer')
  }, [navigate])

  const applyDecision = useCallback((d: DecisionResponse) => {
    setDecision(d)
    if (d.decision === 'GREEN') {
      setResolution({ decision: 'GREEN', message: d.message })
      setView('success')
    } else if (d.decision === 'RED') {
      setResolution({ decision: 'RED', message: d.message, reportReference: d.reportReference })
      setView('blocked')
    } else {
      // ORANGE — open the intervention chat, seeded from d.session
      setResolution(null)
      setView('intervention')
    }
  }, [])

  const resolveIntervention = useCallback((r: Resolution) => {
    setResolution(r)
    setView(r.decision === 'GREEN' ? 'success' : 'blocked')
  }, [])

  const resetAll = useCallback(() => {
    setDecision(null)
    setResolution(null)
    setReceipt(null)
    setPrefill(null)
    setDemoState({ activeCallDetected: false, remoteAccessAppDetected: false })
    navigate('/')
    setView('home')
  }, [navigate])

  // Scenario picker: prefill the transfer form by REAL iban and set the
  // coercion toggles that make each scenario land as intended. The scenario
  // amounts respect the 0.5 × balance escalation threshold.
  const selectScenario = useCallback(
    (scenarioId: string) => {
      const s = DEMO_SCENARIOS.find((x) => x.id === scenarioId)
      if (!s) return
      setDemoState({ activeCallDetected: s.activeCall, remoteAccessAppDetected: s.remoteAccess })
      setPrefill({
        iban: s.iban,
        amount: s.amount,
        purpose: s.purpose,
        presentAsPasted: s.presentAsPasted,
        nonce: Date.now(),
      })
      setDecision(null)
      setResolution(null)
      setReceipt(null)
      navigate('/')
      setView('transfer')
      setDemoOpen(false)
    },
    [navigate],
  )

  const value = useMemo<AppState>(
    () => ({
      customer,
      customerError,
      accounts,
      accountsError,
      path,
      navigate,
      view,
      goHome,
      goTransfer,
      demo,
      setDemo,
      prefill,
      selectScenario,
      demoOpen,
      setDemoOpen,
      decision,
      applyDecision,
      resolution,
      resolveIntervention,
      receipt,
      setReceipt,
      resetAll,
    }),
    [
      customer,
      customerError,
      accounts,
      accountsError,
      path,
      navigate,
      view,
      goHome,
      goTransfer,
      demo,
      setDemo,
      prefill,
      selectScenario,
      demoOpen,
      decision,
      applyDecision,
      resolution,
      resolveIntervention,
      receipt,
      resetAll,
    ],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useApp(): AppState {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
