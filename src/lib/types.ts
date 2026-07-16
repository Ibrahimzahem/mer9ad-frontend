// Types are lifted verbatim from the live Shield API contract.
// Response DTOs use @JsonInclude(NON_NULL): null fields are OMITTED, so
// optional fields below are genuinely absent, not null.

export type EntryMethod = 'typed' | 'pasted' | 'autofilled'
export type Decision = 'GREEN' | 'ORANGE' | 'RED'
export type Action = 'PROCEED' | 'STEP_UP_CHALLENGE' | 'BLOCK_AND_REPORT'

export interface TransferIntentRequest {
  eventId: string
  customerRef: string
  transfer: {
    beneficiaryIban: string
    amount: number
    isNewBeneficiary: boolean
    purpose: { text: string; entryMethod: EntryMethod }
  }
  signals: {
    behavioral: {
      cadenceDeviation: number
      cadenceSamples: number
      deviceInconsistency: number
      baselineSource: string
    }
    coercion: {
      ibanEntryMethod: EntryMethod
      maxIdleGapMs: number
      activeCallDetected: boolean
      remoteAccessAppDetected: boolean
      purposeEntryMethod: EntryMethod
      purposeFilledAfterIbanMs: number
    }
  }
}

export interface DecisionResponse {
  decisionId: string
  decision: Decision
  action: Action
  message: string
  session?: { sessionId: string; question: string }
  reportReference?: string
  agents?: AgentVerdictInfo[]
  sar?: SarInfo
  lesson?: LessonInfo
}

export interface AgentVerdictInfo {
  agent: string
  decision: Decision
  score: number
  evidence: string
  ruleId: string
  trace?: AgentStepInfo[]
}

export interface AgentStepInfo {
  step: number
  type: 'THOUGHT' | 'TOOL_CALL' | 'TOOL_RESULT' | 'FINAL_ANSWER'
  toolName: string | null
  toolArguments: string | null
  content: string | null
  durationMs: number
}

// GET /api/fraud-intel's `trace` is documented as the same flat, `step`-keyed
// array as agents[].trace above, but the live backend actually sends steps
// wrapped in an object and keyed `stepNumber`. Typed loosely here and
// normalized in IntelDashboard so either shape (or a future fix to match the
// docs) renders without crashing.
export interface RawTraceStep {
  step?: number
  stepNumber?: number
  type: AgentStepInfo['type']
  toolName: string | null
  toolArguments: string | null
  content: string | null
  durationMs: number
}

export type FraudIntelTrace = RawTraceStep[] | { steps: RawTraceStep[] }

export interface SarInfo {
  sarId: string
  timestamp: string
  narrative: string
  status: string
  factorCount: number
}

export interface LessonInfo {
  scamName: string
  lesson: string
  signs: string[]
  action: string
  outcome: string
  playbookSize: number
}

export interface InvalidIbanError {
  error: 'INVALID_IBAN'
  message: string
  beneficiaryIban: string
}

export type ReplyAction = 'ASK' | 'RESOLVED'

export interface ReplyResponse {
  action: ReplyAction
  message: string
  finalDecision?: 'GREEN' | 'RED'
}

export interface Account {
  iban: string
  accountAgeDays: number
  transitVelocity: number
  muleWatchlistHit: boolean
  verifiedBalance: number
}

// GET /api/customer — the whole demo user. The UI is driven entirely by this.
// `saved` marks a trusted/on-file payee vs a new payee; it is NOT a risk signal
// and must never be used to color/flag risk. `relationship` is a display label.
export interface Beneficiary {
  name: string
  iban: string
  relationship: string
  saved: boolean
}

export interface Transaction {
  date: string // ISO date, e.g. "2026-06-01"
  counterparty: string
  iban: string
  amount: number
  direction: 'IN' | 'OUT'
  category: string
}

export interface Customer {
  customerRef: string
  name: string
  iban: string
  balance: number
  beneficiaries: Beneficiary[]
  transactions: Transaction[]
  historySummary: string
}

export type IntelOutcome =
  | 'PROCEEDED_SAFE'
  | 'ABANDONED'
  | 'BLOCKED'
  | 'CHALLENGE_FAILED'
  | 'CHALLENGE_ISSUED'

export interface SignalsSnapshot {
  amount: number
  isNewBeneficiary: boolean
  purposeEntryMethod: EntryMethod
  ibanEntryMethod: EntryMethod
  activeCallDetected: boolean
  remoteAccessAppDetected: boolean
  maxIdleGapMs: number
  behavioralScore: number
  beneficiaryAccountAgeDays: number
  beneficiaryTransitVelocity: number
  muleWatchlistHit: boolean
}

export interface FraudIntelRecord {
  eventId: string
  customerRef: string
  beneficiaryIban: string
  decision: Decision
  outcome: IntelOutcome
  signalsSnapshot: SignalsSnapshot
  detectedPattern: string | null
  timestamp: string
  // Always present, always nullable (unlike the NON_NULL-omitted fields
  // above) — null whenever the backend ran in deterministic (no-AI) mode.
  trace: FraudIntelTrace | null
}

// Thrown by api.ts when the backend returns HTTP 400 INVALID_IBAN.
export class IbanValidationError extends Error {
  beneficiaryIban: string
  constructor(payload: InvalidIbanError) {
    super(payload.message)
    this.name = 'IbanValidationError'
    this.beneficiaryIban = payload.beneficiaryIban
  }
}
