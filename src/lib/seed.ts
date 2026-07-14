// Demo-only seed data. The customer, balance, payees and statement are NO LONGER
// hardcoded here — they come live from GET /api/customer (see lib/api.ts). What
// stays here is UI-side demo scaffolding: the purpose presets and the
// demo-controls scenario prefills (keyed by the backend's REAL beneficiary IBANs).

export const PURPOSE_PRESETS = [
  'سداد',
  'مصاريف عائلية',
  'إيجار',
  'ثمن سيارة',
  'هدية',
  'أخرى',
] as const

// Fallback ref used only if /api/customer is unavailable when a transfer is sent.
export const DEFAULT_CUSTOMER_REF = 'cust_8842'

export type ScenarioTone = 'GREEN' | 'ORANGE' | 'RED'

export interface DemoScenario {
  id: string
  tone: ScenarioTone // for the marker color / grouping only — NOT a claim about the account
  title: string
  sub: string
  iban: string
  amount: string
  purpose: string
  presentAsPasted: boolean
  activeCall: boolean
  remoteAccess: boolean
}

// Balance is 8500 SAR; the backend escalates when amount > 0.5 × balance (> 4250),
// so the GREEN preset stays well under that. ORANGE/RED are driven by account facts
// (new payee / high transit / mule watchlist) and the coercion signals.
export const DEMO_SCENARIOS: DemoScenario[] = [
  {
    id: 'green-trusted',
    tone: 'GREEN',
    title: 'أخضر · مستفيد موثوق',
    sub: 'خالد العتيبي — يمرّ مباشرة',
    iban: 'SA0000000000000000001111',
    amount: '500',
    purpose: 'سداد',
    presentAsPasted: false,
    activeCall: false,
    remoteAccess: false,
  },
  {
    id: 'orange-coached',
    tone: 'ORANGE',
    title: 'برتقالي · ضحية مُوجَّهة',
    sub: 'عبدالعزيز (جديد) + مكالمة → يُحظر',
    iban: 'SA0000000000000000002222',
    amount: '3000',
    purpose: 'مصاريف عائلية',
    presentAsPasted: true,
    activeCall: true,
    remoteAccess: false,
  },
  {
    id: 'orange-friend',
    tone: 'ORANGE',
    title: 'برتقالي · صديق جديد',
    sub: 'سعد الدوسري — يوضّح فيُسمح',
    iban: 'SA0000000000000000006666',
    amount: '1500',
    purpose: 'سداد دين',
    presentAsPasted: false,
    activeCall: false,
    remoteAccess: false,
  },
  {
    id: 'orange-international',
    tone: 'ORANGE',
    title: 'برتقالي · تحويل دولي',
    sub: 'Ahmed Trading — مبلغ كبير',
    iban: 'SA0000000000000000008888',
    amount: '5000',
    purpose: 'دفعة تجارية',
    presentAsPasted: false,
    activeCall: false,
    remoteAccess: false,
  },
  {
    id: 'red-mule-1',
    tone: 'RED',
    title: 'أحمر · حساب مُمرِّر',
    sub: 'سلطان الغامدي — حظر قطعي',
    iban: 'SA0000000000000000003333',
    amount: '3000',
    purpose: 'سداد',
    presentAsPasted: false,
    activeCall: false,
    remoteAccess: false,
  },
  {
    id: 'red-mule-2',
    tone: 'RED',
    title: 'أحمر · حساب مُمرِّر',
    sub: 'ماجد القحطاني — حظر قطعي',
    iban: 'SA0000000000000000007777',
    amount: '3000',
    purpose: 'سداد',
    presentAsPasted: false,
    activeCall: false,
    remoteAccess: false,
  },
  {
    id: 'red-structuring',
    tone: 'RED',
    title: 'أحمر · تجزئة (AML)',
    sub: 'مؤسسة الفجر — 4 تحويلات صغيرة → وكيل AML',
    iban: 'SA0000000000000000009999',
    amount: '9000',
    purpose: 'دفعات',
    presentAsPasted: false,
    activeCall: false,
    remoteAccess: false,
  },
]
