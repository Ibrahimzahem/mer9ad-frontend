# Frontend spec — Shield demo (درع / رشد)

You are a frontend Claude Code agent. Build a demo frontend for the **Shield** anti-social-engineering fraud backend. You have only this file and a running backend — everything you need is here. No guessing: every endpoint, field, and seeded value below is taken verbatim from the backend implementation.

Shield protects a bank customer from **social-engineering / authorized-push-payment (APP) fraud** at the moment they initiate a transfer. It detects **coercion, not identity**. Its centerpiece is the **grey-zone (ORANGE) intervention**: when a transfer is suspicious-but-unconfirmed, the backend neither approves nor blocks — it opens a short AI conversation that breaks the scammer's manufactured urgency and brings the victim back to awareness.

---

## Actual API contract

**Base URL:** `http://localhost:8080` (override via `VITE_API_BASE`). No auth.

**CORS:** the backend already allows the Vite dev origin. It maps `/api/**` for origin `http://localhost:5173`, methods `GET, POST, OPTIONS`, all headers (`WebCorsConfig.java`). So run the frontend on **port 5173** — any other port will be blocked by the browser.

All request/response bodies are JSON (`Content-Type: application/json`). Response DTOs use `@JsonInclude(NON_NULL)` — **null fields are omitted entirely**, so `session` and `reportReference` only appear when relevant.

### Endpoints

| Method & path | Purpose |
|---|---|
| `POST /api/transfer-intent` | Assess a transfer. Returns a GREEN / ORANGE / RED decision. |
| `POST /api/intervention/{sessionId}/reply` | Continue the grey-zone dialogue (only after an ORANGE). |
| `GET /api/fraud-intel` | Labeled grey-zone outcome feed (grows after each ORANGE/RED). |
| `GET /api/scam-playbook` | Known + newly-learned manipulation patterns (array of Arabic strings). |
| `GET /api/accounts` | The seeded beneficiary accounts (demo visibility). |

---

### `POST /api/transfer-intent`

**Request body** — exact shape (field names and types are literal; `amount` is a number, `*Ms` are integers, booleans are booleans):

```json
{
  "eventId": "evt_1",
  "customerRef": "cust_8842",
  "transfer": {
    "beneficiaryIban": "SA0000000000000000001111",
    "amount": 100.0,
    "isNewBeneficiary": false,
    "purpose": { "text": "سداد", "entryMethod": "typed" }
  },
  "signals": {
    "behavioral": {
      "cadenceDeviation": 0.1,
      "cadenceSamples": 6,
      "deviceInconsistency": 0.1,
      "baselineSource": "personal"
    },
    "coercion": {
      "ibanEntryMethod": "typed",
      "maxIdleGapMs": 1000,
      "activeCallDetected": false,
      "remoteAccessAppDetected": false,
      "purposeEntryMethod": "typed",
      "purposeFilledAfterIbanMs": 6000
    }
  }
}
```

Field notes:
- `entryMethod` / `ibanEntryMethod` / `purposeEntryMethod` ∈ `"typed" | "pasted" | "autofilled"`. Anything other than `"typed"` counts as a coercion signal.
- `baselineSource` is a free string (e.g. `"personal"` | `"population"`); informational only.
- `maxIdleGapMs`, `purposeFilledAfterIbanMs` are integer milliseconds.
- The backend **recomputes every server-side fact itself** (account age, transit velocity, mule flag, balance). The client never sends these and cannot influence them.
- **IBAN validation:** `beneficiaryIban` must be a valid Saudi IBAN = `SA` + exactly 22 digits (24 chars total, uppercase, no spaces). A malformed IBAN is rejected **before** the pipeline with **HTTP 400** (see below).

**Response** — one of three decisions. `decision` ∈ `GREEN | ORANGE | RED`; `action` ∈ `PROCEED | STEP_UP_CHALLENGE | BLOCK_AND_REPORT`. `decisionId` is always present (`dec_` + 8 hex chars).

**GREEN** (only `decisionId`, `decision`, `action`, `message`):
```json
{
  "decisionId": "dec_1a2b3c4d",
  "decision": "GREEN",
  "action": "PROCEED",
  "message": "تمت الموافقة على التحويل."
}
```

**ORANGE** (adds `session`; `session.sessionId` = `sess_` + 8 hex chars; `session.question` is the AI's first Arabic question — it equals `message`):
```json
{
  "decisionId": "dec_1a2b3c4d",
  "decision": "ORANGE",
  "action": "STEP_UP_CHALLENGE",
  "message": "قبل أن نُكمل، من فضلك أخبرني بكلماتك أنت: من صاحب هذا الحساب بالضبط، ومتى تعرّفت عليه، ولماذا تُحوّل له الآن؟",
  "session": {
    "sessionId": "sess_9f8e7d6c",
    "question": "قبل أن نُكمل، من فضلك أخبرني بكلماتك أنت: من صاحب هذا الحساب بالضبط، ومتى تعرّفت عليه، ولماذا تُحوّل له الآن؟"
  }
}
```

**RED** (adds `reportReference` = `RPT-` + 8 uppercase hex chars; no `session`):
```json
{
  "decisionId": "dec_1a2b3c4d",
  "decision": "RED",
  "action": "BLOCK_AND_REPORT",
  "message": "تم إيقاف التحويل: الحساب المستفيد مُدرج ضمن قائمة حسابات تمرير الأموال. هذا قرار قطعي لحمايتك.",
  "reportReference": "RPT-AB12CD34"
}
```

**HTTP 400 — invalid IBAN** (thrown before assessment; `beneficiaryIban` echoes back what was sent):
```json
{
  "error": "INVALID_IBAN",
  "message": "Invalid Saudi IBAN: it must be 'SA' followed by exactly 22 digits (24 characters total).",
  "beneficiaryIban": "SA00000000000003333"
}
```

The response deliberately **never exposes scores, thresholds, or which signal fired** — only what the UI should render.

---

### `POST /api/intervention/{sessionId}/reply`

Use the `session.sessionId` from an ORANGE response as the path segment.

**Request body:**
```json
{ "answer": "هذا حساب صديقي خالد الذي أعرفه منذ سنوات وأسدد له ثمن سيارة اشتريتها منه" }
```

**Response** — `action` ∈ `ASK | RESOLVED`. `finalDecision` (∈ `GREEN | RED`) is present **only** when `action` is `RESOLVED`.

Keep asking (`ASK`, no `finalDecision`):
```json
{
  "action": "ASK",
  "message": "ذكرت أن الغرض «مصاريف عائلية»، لكن هذا الحساب فُتح قبل أيام قليلة ولم تُرسل إليه من قبل. هل طلب منك شخصٌ الآن أن تكتب هذا الغرض تحديدًا؟ اكتب لي اسم صاحب الحساب وصلة قرابتك به."
}
```

Resolved to GREEN (victim's answer was convincing / self-sourced):
```json
{
  "action": "RESOLVED",
  "message": "شكرًا لتوضيحك. تبدو التفاصيل متّسقة ونابعة منك. يمكنك المتابعة بأمان.",
  "finalDecision": "GREEN"
}
```

Resolved to RED (coaching detected / turns exhausted):
```json
{
  "action": "RESOLVED",
  "message": "إجاباتك تتطابق مع نص مُحضَّر مسبقًا ولا تتوافق مع حقائق الحساب. لحمايتك، سنوقف هذا التحويل الآن. إن كان أحدٌ يوجّهك عبر الهاتف، فمن المرجّح أنه محتال.",
  "finalDecision": "RED"
}
```

Session behavior (from the backend): sessions live **3 minutes** and allow up to **3 Shield questions** (`MAX_TURNS = 3`). If you POST a reply to an unknown/expired `sessionId`, you get a resolved RED: `{"action":"RESOLVED","message":"انتهت صلاحية الجلسة أو أنها غير موجودة.","finalDecision":"RED"}`.

**Deterministic offline behavior** (the demo runs with no API key, using the built-in stub — see "Scenario walkthrough" for the exact number of turns): a reply is treated as *coached* when it is blank, shorter than 8 characters, or contains `"عائلية"`. A blank/short/scripted answer twice → RED; one detailed, self-sourced answer → GREEN.

---

### `GET /api/fraud-intel`

Returns a JSON **array** of records, oldest first. Grows by one every time a transfer resolves to ORANGE (`outcome: "CHALLENGE_ISSUED"`), RED via mule (`"BLOCKED"`), RED via failed challenge (`"CHALLENGE_FAILED"`), or GREEN via a passed challenge (`"PROCEEDED_SAFE"`). Record shape:

```json
[
  {
    "eventId": "evt_3",
    "customerRef": "cust_8842",
    "beneficiaryIban": "SA0000000000000000003333",
    "decision": "RED",
    "outcome": "BLOCKED",
    "signalsSnapshot": {
      "amount": 900.0,
      "isNewBeneficiary": true,
      "purposeEntryMethod": "pasted",
      "ibanEntryMethod": "pasted",
      "activeCallDetected": true,
      "remoteAccessAppDetected": false,
      "maxIdleGapMs": 25300,
      "behavioralScore": 0.234,
      "beneficiaryAccountAgeDays": 10,
      "beneficiaryTransitVelocity": 0.9,
      "muleWatchlistHit": true
    },
    "detectedPattern": null,
    "timestamp": "2026-06-30T12:00:00.000000Z"
  }
]
```

- `decision` ∈ `GREEN | ORANGE | RED`; `outcome` ∈ `PROCEEDED_SAFE | ABANDONED | BLOCKED | CHALLENGE_FAILED | CHALLENGE_ISSUED`.
- `signalsSnapshot` is a flat object of the fields above (keys exactly as shown). `behavioralScore` is derived server-side; display it read-only.
- `detectedPattern` is a nullable Arabic string (set when the intervention learns a fresh coaching pattern).
- `timestamp` is ISO-8601 UTC.

### `GET /api/scam-playbook`

Returns a JSON **array of Arabic strings**. Seeded with three known patterns; a new one is appended whenever an intervention detects a fresh coaching script. Seeded content:

```json
[
  "تلقين الضحية كتابة \"مصاريف عائلية\" كغرض لتحويل إلى حساب جديد لا علاقة له بالعائلة",
  "إجراء التحويل أثناء مكالمة مباشرة مع محتال ينتحل صفة دعم البنك",
  "لصق رقم آيبان (IBAN) تم استلامه عبر واتساب من جهة غير معروفة"
]
```

### `GET /api/accounts`

Returns a JSON **array** of the seeded beneficiary accounts (server-verified facts). Shape:

```json
[
  { "iban": "SA0000000000000000000000", "accountAgeDays": 1200, "transitVelocity": 0.05, "muleWatchlistHit": false, "verifiedBalance": 999999.0 },
  { "iban": "SA0000000000000000001111", "accountAgeDays": 800,  "transitVelocity": 0.10, "muleWatchlistHit": false, "verifiedBalance": 50000.0 },
  { "iban": "SA0000000000000000002222", "accountAgeDays": 3,    "transitVelocity": 0.85, "muleWatchlistHit": false, "verifiedBalance": 1200.0 },
  { "iban": "SA0000000000000000003333", "accountAgeDays": 10,   "transitVelocity": 0.90, "muleWatchlistHit": true,  "verifiedBalance": 4000.0 }
]
```

> Note: `/api/accounts` returns from a `ConcurrentHashMap`, so **array order is not guaranteed**. Never rely on index; match by `iban`.

---

### The seeded customer and beneficiaries (what to hardcode in the demo)

The paying customer is **`cust_8842`**, verified balance **1000.0 SAR**, whose known payees are the salary account and the established payee.

| IBAN | Label (invent a name) | Age | Transit | Mule | Expected decision | Why |
|---|---|---|---|---|---|---|
| `SA0000000000000000000000` | Salary / راتب | 1200d | 0.05 | no | **GREEN** | Known payee, benign. |
| `SA0000000000000000001111` | Established payee / مستفيد معتمد | 800d | 0.10 | no | **GREEN** | Known payee, old account, low transit → triage CLEAR. |
| `SA0000000000000000002222` | New account / حساب جديد | 3d | 0.85 | no | **ORANGE** | New + high transit → escalates, but age 3 fails the ≤2-day hard-fact, so it must *talk* to the victim. |
| `SA0000000000000000003333` | Mule / حساب مشبوه | 10d | 0.90 | **yes** | **RED** | On the mule watchlist → deterministic block, AI not even consulted. |

These are the four **real** IBANs. The demo-controls panel must prefill by these exact strings.

> To reliably reproduce GREEN, send benign signals (all `typed`, no call, no remote app, `maxIdleGapMs` small, `purposeFilledAfterIbanMs` ≥ 1500, low behavioral values) **and** an `amount` ≤ 500 (the backend escalates when `amount > 0.5 × balance`, i.e. > 500 for this customer). For ORANGE/RED, the mule/new-account facts dominate regardless.

---

## 1. What to build

A fake **mobile banking app clone** (neutral name, e.g. «بنك المدى / Bank XYZ») that demonstrates Shield end to end. Render it as a **phone frame centered on the page**, mobile-first, **Arabic-first and RTL** (`dir="rtl"` on the root). It's a prototype demo, not a real product.

## 2. Tech stack

React + Vite + TypeScript, Tailwind CSS, plain React state/context (no Redux), `fetch` to the backend. Base URL from `VITE_API_BASE` (default `http://localhost:8080`). No auth. Keep it a small set of components. Run the dev server on **port 5173** (required — that is the only CORS-allowed origin).

## 3. The flow it must exercise

- **Home**: total balance (1000.00 SAR for `cust_8842`) + the customer's accounts + a تحويل (Transfer) button, mirroring the seeded customer.
- **Transfer / add-beneficiary screen**: inputs for beneficiary IBAN, amount, and purpose (preset dropdown + free text). On submit → `POST /api/transfer-intent` with the full signals payload (exact shape above).
- **GREEN** → smooth success ("جارٍ التحويل / تمت الإضافة"), show `message`.
- **ORANGE** → transition into the intervention chat (section 5), seeded from `session`.
- **RED** → a firm block screen: the AI `message` + awareness text + `reportReference`.
- Handle the **400 INVALID_IBAN** case: show an inline field error ("رقم آيبان غير صالح") using the returned `message`; do not crash or route away.

## 4. Signal capture — must be real, not faked

The frontend must actually collect what it sends; this is core to the concept. Capture and send in the `signals` object:

- `ibanEntryMethod`: detect paste vs typing on the IBAN field (`onPaste` → `"pasted"`, keystrokes only → `"typed"`).
- `purposeEntryMethod` + `purposeFilledAfterIbanMs`: same paste detection on the purpose field, plus the milliseconds between finishing the IBAN and finishing the purpose.
- `maxIdleGapMs`: track interaction timestamps on the transfer screen; report the longest gap with no input.
- `cadenceDeviation` / `deviceInconsistency`: a rough keystroke-timing estimate if feasible; otherwise a scenario preset — **state in the UI/README that these are approximated for a web demo**. `cadenceSamples` = number of keystroke intervals measured. `baselineSource` = `"personal"` if you have a baseline, else `"population"`.
- `activeCallDetected` / `remoteAccessAppDetected`: not detectable in a browser → expose as **toggles in the demo-controls panel** (section 8) and send whatever they're set to.

Remember: the backend ignores any server-fact you try to send; only these client signals + the IBAN/amount/purpose actually matter.

## 5. The intervention chat — the centerpiece

When `/transfer-intent` returns ORANGE with a `session`, open a full-screen **secure conversation** view:

- RTL chat bubbles: AI (Shield) messages on one side, the user's replies on the other, with a text input + send button.
- Seed the first bubble with `session.question`. On send → `POST /api/intervention/{sessionId}/reply` with `{ "answer": "<text>" }`.
  - `action: "ASK"` → append the returned `message` as a new Shield bubble and keep the conversation open.
  - `action: "RESOLVED"` → route to the cleared (GREEN) or blocked (RED) screen per `finalDecision`, surfacing the final `message`.
- Surface the AI's warning/awareness text prominently.
- **Design intent:** this screen should feel calm and deliberately *slower* than the rest of the app — unhurried transitions, breathing room, a typing-indicator pause before each Shield reply — because the whole point is breaking the scammer's manufactured urgency. Make the pace itself part of the message.

## 6. Judge-facing intelligence view

A separate route `/intel` (same aesthetic, more dashboard-like) with two live panels:

- **Fraud-intelligence feed** ← `GET /api/fraud-intel`: render each record's `decision`, `outcome`, `beneficiaryIban`, `timestamp`, and a compact view of `signalsSnapshot`. Frame it as "labeled social-engineering data feeding national / GCC fraud intelligence." Newest at top (reverse the array for display).
- **Scam-script playbook** ← `GET /api/scam-playbook`: list the Arabic pattern strings so judges watch the list grow right after a coached intervention.

Add a **refresh button** and/or a short poll (e.g. every 3–5s) so both panels update live during the demo.

## 7. Aesthetic — minimalist "ink on paper"

Beige and black, editorial, printmaking feel. No drop shadows, no glassmorphism, no decorative gradients.

- **Palette:** paper background `#EDE8DC`, ink text `#1A1712`, hairline borders = ink at low opacity. State accents desaturated and earthy, used sparingly: cleared/green `#3A5A40`, caution/orange `#B07A2E` (ochre), block/red `#7A2E2E` (oxblood).
- **Texture:** very subtle paper grain; hairline rules instead of boxed cards where possible.
- **Type:** Arabic-first pairing — an editorial Arabic face (Amiri or Noto Naskh Arabic) for headings, a clean Arabic UI face (IBM Plex Sans Arabic or Tajawal) for body; tabular numerals for balances. Generous whitespace, single column, large touch targets.
- **Motion:** minimal and purposeful; the ORANGE transition slow and deliberate.

## 8. Demo controls — bulletproof the live demo

A discreet panel (long-press the logo, or a `?demo` query param) to:

- Pick which seeded beneficiary to prefill by real IBAN: **GREEN** `SA0000000000000000001111`, **ORANGE** `SA0000000000000000002222`, **RED** `SA0000000000000000003333`.
- Toggle `activeCallDetected` and `remoteAccessAppDetected`.
- Reset frontend state.

So on stage you select a scenario and go — no typing IBANs live. (Prefilling still routes through the real signal-capture code; you can also present it as "pasted" to demonstrate the coercion signal.)

## 9. Config & run

- `.env` with `VITE_API_BASE=http://localhost:8080`.
- `npm run dev` on **port 5173** (set `server.port` in `vite.config.ts` or use `--port 5173`).
- A README with run steps and a demo walkthrough that runs the three scenarios in order (below).

## 10. Scenario walkthrough (the exact demo, against the live backend)

Start the backend (`./mvnw spring-boot:run`, boots on `:8080` with `StubShieldAi` and no API key needed), then:

1. **GREEN** — transfer to `SA0000000000000000001111`, amount `100`, purpose typed, all benign signals → response `decision: "GREEN"`, `action: "PROCEED"`. Show the success screen.
2. **ORANGE → RED (coached victim)** — transfer to `SA0000000000000000002222`, amount `900`, purpose `"مصاريف عائلية"` pasted, `activeCallDetected: true` → response `decision: "ORANGE"` with a `session`. Open the chat. Reply `"مصاريف عائلية"` → `action: "ASK"` (Shield reflects the contradiction). Reply `"مصاريف عائلية"` again → `action: "RESOLVED"`, `finalDecision: "RED"`. Route to the block screen. *(Two coached replies → RED.)*
3. **ORANGE → GREEN (real customer)** — repeat step 2 to get a fresh ORANGE `session`, but reply once with a detailed, self-sourced answer, e.g. `"هذا حساب صديقي خالد الذي أعرفه منذ سنوات وأسدد له ثمن سيارة اشتريتها منه"` → `action: "RESOLVED"`, `finalDecision: "GREEN"`. *(One convincing reply → GREEN. Use a new session — a resolved session is closed.)*
4. **RED (mule)** — transfer to `SA0000000000000000003333` → immediate `decision: "RED"`, `action: "BLOCK_AND_REPORT"`, with a `reportReference`. No chat; the mule is a deterministic block.
5. Open `/intel` and refresh: the **fraud-intel feed** now shows the ORANGE/RED/GREEN outcomes from the runs above, and the **playbook** shows the seeded three patterns plus any freshly-learned coaching pattern.

## 11. Done when

The phone-framed banking app runs on `:5173`; all three seeded scenarios work end-to-end against the live backend; ORANGE opens the RTL chat and resolves to GREEN or RED based on the conversation; the 400 invalid-IBAN path shows a clean field error; and `/intel` shows both feeds populating after interventions.
