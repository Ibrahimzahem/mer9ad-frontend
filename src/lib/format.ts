// Money formatting uses Western digits with tabular numerals (the .tnum class)
// so balances align. Arabic UI, Western numerals — common in KSA banking apps.

export function formatMoney(n: number): string {
  return n.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

// Mask an IBAN for display: keep SA + first 4 and last 4.
export function maskIban(iban: string): string {
  if (iban.length < 12) return iban
  return `${iban.slice(0, 6)} •••• ${iban.slice(-4)}`
}

// Statement date: "2026-06-30" → "٣٠ يونيو" (Gregorian, Arabic).
export function formatDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('ar-u-ca-gregory', { day: 'numeric', month: 'short' })
}

export function formatTime(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString('ar-SA', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
