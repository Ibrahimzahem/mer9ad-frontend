import {
  type Account,
  type Customer,
  type DecisionResponse,
  type FraudIntelRecord,
  IbanValidationError,
  type InvalidIbanError,
  type ReplyResponse,
  type TransferIntentRequest,
} from './types'

// When served from the same origin (bundled in Spring Boot), use relative URLs.
// When developing with Vite (port 5173), default to the backend on 8080.
const BASE = (import.meta.env.VITE_API_BASE ?? '').replace(/\/$/, '')

async function json<T>(res: Response): Promise<T> {
  const text = await res.text()
  return text ? (JSON.parse(text) as T) : (undefined as T)
}

export async function assessTransfer(body: TransferIntentRequest): Promise<DecisionResponse> {
  const res = await fetch(`${BASE}/api/transfer-intent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (res.status === 400) {
    // IBAN rejected before the pipeline — surface as a typed field error.
    const err = await json<InvalidIbanError>(res)
    throw new IbanValidationError(err)
  }
  if (!res.ok) throw new Error(`transfer-intent failed: ${res.status}`)
  return json<DecisionResponse>(res)
}

export async function replyToIntervention(
  sessionId: string,
  answer: string,
): Promise<ReplyResponse> {
  const res = await fetch(`${BASE}/api/intervention/${encodeURIComponent(sessionId)}/reply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ answer }),
  })
  if (!res.ok) throw new Error(`intervention reply failed: ${res.status}`)
  return json<ReplyResponse>(res)
}

// The whole demo user drives the UI. No ref → the default seeded customer;
// pass a ref to hit /api/customer/{ref} (404 if unknown).
export async function getCustomer(customerRef?: string): Promise<Customer> {
  const path = customerRef ? `/api/customer/${encodeURIComponent(customerRef)}` : '/api/customer'
  const res = await fetch(`${BASE}${path}`)
  if (!res.ok) throw new Error(`customer failed: ${res.status}`)
  return json<Customer>(res)
}

export async function getAccounts(): Promise<Account[]> {
  const res = await fetch(`${BASE}/api/accounts`)
  if (!res.ok) throw new Error(`accounts failed: ${res.status}`)
  return json<Account[]>(res)
}

export async function getFraudIntel(): Promise<FraudIntelRecord[]> {
  const res = await fetch(`${BASE}/api/fraud-intel`)
  if (!res.ok) throw new Error(`fraud-intel failed: ${res.status}`)
  return json<FraudIntelRecord[]>(res)
}

export async function getScamPlaybook(): Promise<string[]> {
  const res = await fetch(`${BASE}/api/scam-playbook`)
  if (!res.ok) throw new Error(`scam-playbook failed: ${res.status}`)
  return json<string[]>(res)
}
