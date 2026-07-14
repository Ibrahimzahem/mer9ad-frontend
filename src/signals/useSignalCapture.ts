import { useCallback, useRef, useState } from 'react'
import type { EntryMethod, TransferIntentRequest } from '../lib/types'

// Real client-side signal capture. Everything measurable in a browser is
// measured here (paste vs type, inter-field timing, idle gaps, keystroke
// cadence). activeCallDetected / remoteAccessAppDetected are NOT browser-
// detectable, so they come from the demo-controls toggles (passed to collect).
//
// cadenceDeviation / deviceInconsistency are APPROXIMATED for a web demo —
// this is stated in the UI (Transfer screen) and the README.

interface Store {
  ibanEntry: EntryMethod
  purposeEntry: EntryMethod
  ibanLastInputAt: number | null
  purposeLastInputAt: number | null
  lastInteractionAt: number | null
  maxIdleGapMs: number
  intervals: number[]
  lastKeyAt: number | null
}

function fresh(): Store {
  return {
    ibanEntry: 'typed',
    purposeEntry: 'typed',
    ibanLastInputAt: null,
    purposeLastInputAt: null,
    lastInteractionAt: null,
    maxIdleGapMs: 0,
    intervals: [],
    lastKeyAt: null,
  }
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n))
}

// Coefficient of variation of keystroke intervals → a rough "irregular typing"
// signal, clamped to [0,1]. Real data, approximate meaning.
function cadenceDeviation(intervals: number[]): number {
  if (intervals.length < 2) return 0.1
  const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length
  if (mean === 0) return 0.1
  const variance =
    intervals.reduce((a, b) => a + (b - mean) ** 2, 0) / intervals.length
  const cv = Math.sqrt(variance) / mean
  return clamp01(cv / 2)
}

export interface DemoToggles {
  activeCallDetected: boolean
  remoteAccessAppDetected: boolean
}

export function useSignalCapture() {
  const store = useRef<Store>(fresh())
  // React-visible mirror so the UI can show "paste detected" chips live.
  const [entry, setEntry] = useState<{ iban: EntryMethod; purpose: EntryMethod }>({
    iban: 'typed',
    purpose: 'typed',
  })

  const touch = useCallback(() => {
    const s = store.current
    const now = performance.now()
    if (s.lastInteractionAt != null) {
      const gap = now - s.lastInteractionAt
      if (gap > s.maxIdleGapMs) s.maxIdleGapMs = gap
    }
    s.lastInteractionAt = now
  }, [])

  const keystroke = useCallback(() => {
    const s = store.current
    const now = performance.now()
    if (s.lastKeyAt != null) {
      const dt = now - s.lastKeyAt
      if (dt > 0 && dt < 4000) s.intervals.push(dt)
    }
    s.lastKeyAt = now
  }, [])

  // ---- IBAN field ----
  const onIbanPaste = useCallback(() => {
    store.current.ibanEntry = 'pasted'
    store.current.ibanLastInputAt = performance.now()
    setEntry((e) => ({ ...e, iban: 'pasted' }))
    touch()
  }, [touch])

  const onIbanKeyDown = useCallback(() => {
    keystroke()
  }, [keystroke])

  const onIbanChange = useCallback(() => {
    store.current.ibanLastInputAt = performance.now()
    touch()
  }, [touch])

  // ---- Purpose field ----
  const onPurposePaste = useCallback(() => {
    store.current.purposeEntry = 'pasted'
    store.current.purposeLastInputAt = performance.now()
    setEntry((e) => ({ ...e, purpose: 'pasted' }))
    touch()
  }, [touch])

  const onPurposeKeyDown = useCallback(() => {
    keystroke()
  }, [keystroke])

  const onPurposeChange = useCallback(() => {
    store.current.purposeLastInputAt = performance.now()
    touch()
  }, [touch])

  // Demo-controls prefill can present a field as "pasted" to demonstrate the
  // coercion signal, while still flowing through this same capture code.
  const setEntryMethod = useCallback(
    (field: 'iban' | 'purpose', method: EntryMethod) => {
      const now = performance.now()
      if (field === 'iban') {
        store.current.ibanEntry = method
        store.current.ibanLastInputAt = now
      } else {
        store.current.purposeEntry = method
        store.current.purposeLastInputAt = now
      }
      setEntry((e) => ({ ...e, [field]: method }))
      touch()
    },
    [touch],
  )

  const reset = useCallback(() => {
    store.current = fresh()
    setEntry({ iban: 'typed', purpose: 'typed' })
  }, [])

  // Build the exact signals payload the backend expects.
  const collect = useCallback(
    (
      toggles: DemoToggles,
    ): Pick<TransferIntentRequest['signals'], 'behavioral' | 'coercion'> => {
      const s = store.current
      const now = performance.now()

      // include the trailing idle gap (time since the last interaction)
      let maxIdle = s.maxIdleGapMs
      if (s.lastInteractionAt != null) {
        const trailing = now - s.lastInteractionAt
        if (trailing > maxIdle) maxIdle = trailing
      }

      const purposeAfterIban =
        s.ibanLastInputAt != null && s.purposeLastInputAt != null
          ? Math.max(0, Math.round(s.purposeLastInputAt - s.ibanLastInputAt))
          : 3000

      const dev = cadenceDeviation(s.intervals)

      return {
        behavioral: {
          cadenceDeviation: Number(dev.toFixed(3)),
          cadenceSamples: s.intervals.length,
          // approximated for a web demo — mild proxy, kept low & honest
          deviceInconsistency: Number(clamp01(dev * 0.6).toFixed(3)),
          baselineSource: s.intervals.length >= 5 ? 'personal' : 'population',
        },
        coercion: {
          ibanEntryMethod: s.ibanEntry,
          maxIdleGapMs: Math.round(maxIdle),
          activeCallDetected: toggles.activeCallDetected,
          remoteAccessAppDetected: toggles.remoteAccessAppDetected,
          purposeEntryMethod: s.purposeEntry,
          purposeFilledAfterIbanMs: purposeAfterIban,
        },
      }
    },
    [],
  )

  return {
    entry,
    handlers: {
      iban: { onPaste: onIbanPaste, onKeyDown: onIbanKeyDown, onChange: onIbanChange },
      purpose: {
        onPaste: onPurposePaste,
        onKeyDown: onPurposeKeyDown,
        onChange: onPurposeChange,
      },
    },
    setEntryMethod,
    touch,
    reset,
    collect,
  }
}
