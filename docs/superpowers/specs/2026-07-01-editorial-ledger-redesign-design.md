# Shield Frontend — "Editorial Ledger" UI Redesign

**Date:** 2026-07-01
**Status:** Approved (visual language + all five screen areas validated via visual companion)
**Scope:** Visual/structural redesign of the existing Shield demo frontend. Free to restructure layouts. **No changes to state, API, routing, or signal-capture logic.**

## 1. Problem

The current UI is competent but reads as a generic "vibe-coded" neobank template. The tells: everything is `rounded-xl`/`rounded-2xl`, cards nest inside cards with translucent `paper-soft` fills, pastel pill chips and badges everywhere, avatar-initial circles, iMessage-style chat bubbles, and a faux iOS status bar with wifi/battery icons. The intended "ink-on-paper editorial printmaking" identity exists only in code comments, not on screen.

## 2. Goal & Positioning

**Realistic as the baseline, impressive in deliberate moments, and the Shield intervention gets special treatment — tasteful, never flashy or corny. "Distinctive in a fair way."**

The design language is **"Editorial Ledger":** the app behaves like a printed financial instrument — a bank statement/ledger crossed with an editorial broadsheet. Ordinary screens (Home, Transfer) are refined and credible; the **Shield moment** (intervention → result) is where "the paper turns against the fraudster" and the experience becomes distinctive.

Constraints carried over unchanged: RTL / Arabic-first, Cairo font, ink-on-paper palette (beige/black), no shadows/glass/decorative gradients, mobile full-viewport + desktop phone-frame responsive shell, port 5173 + Vite `/api` proxy.

## 3. Design System Changes

These are global and propagate to every screen.

### 3.1 Corners
- Replace the universal `rounded-xl`/`rounded-2xl` (12–16px) with **crisp corners**: structural elements use `rounded-[3px]` (`--radius-sm`).
- Soft radius is reserved and intentional in exactly two places: the **device frame** (desktop bezel) and the **user's chat reply blocks** (one corner softened, as a deliberate human-conversation cue).

### 3.2 Rules, not boxes
- Eliminate filled translucent panels (`bg-paper-soft/50`, `bg-*-soft` cards used as decoration). Replace card containers with **ruled regions**: hairline (`--color-ink-12`) or heavy (`--color-ink`) top/bottom rules and negative space.
- Introduce two signature rule motifs:
  - **Masthead rule** — a 2.5px ink line with a 1px line beneath (newspaper double-rule), under the bank nameplate.
  - **Ledger total rule** — two stacked hairlines under the balance figure, like a statement column total.

### 3.3 Typography
- Keep Cairo, but **exploit its full weight range (300–900)** for real editorial contrast. Nameplate/headings use 800–900 with tight tracking (`-0.02em`); body stays 400–500.
- **Kicker** (existing `.kicker`) keeps letterspaced small-caps but gains a **short heavy ink tick** (`::before`, 18–20px × 2px ink bar) to its inline-start.
- Money and all telemetry values use **tabular figures** (`.tnum`), Western digits. Balance figure is large (≈53px), weight 700, tight negative tracking.
- Section index numbers (payee list, playbook) sit in a **margin column** as small tabular figures — not inside pills or circles.

### 3.4 Color discipline
- Ink + paper is the entire palette for Home and Transfer. The three state accents (`--color-green` #3a5a40, `--color-ochre` #b07a2e, `--color-oxblood` #7a2e2e) are **reserved for semantic meaning only** and appear almost exclusively in the Shield moment and Intel telemetry (warnings, stamps, margin marks). Because they're withheld elsewhere, they carry weight when used.

### 3.5 Iconography & chrome
- **Remove the faux status bar** (clock + Signal/Wifi/Battery lucide icons). Replace with the editorial masthead (nameplate + dateline).
- Drastically reduce lucide usage. Prefer typographic/geometric marks (the **seal** — a circled "د" — replaces the shield glyph as the Shield brand mark). Where icons remain, use thin, consistent strokes.
- **Bottom nav:** ruled footer; active item marked by a **2px ink top-border** (a printed tab marker), not a filled/rounded chip. Keep the three items (الرئيسية / تحويل / المركز).

### 3.6 Motion
- Keep motion minimal and purposeful. Retain the slow `orange-veil` (1100ms) reveal into the intervention as a signature — it earns its place.
- Add one **"stamp" animation** for result screens (a quick settle/rotate-in of the approval/block stamp). Respect `prefers-reduced-motion`.

## 4. Per-Screen Design

### 4.1 Home — masthead + ledger
- **Masthead:** "بنك المدى" nameplate (weight 900) with "مؤمَّن بـ درع" beneath; a **dateline** (weekday + date, Arabic-Indic) at the inline-end corner; capped by the masthead double-rule. Replaces the old status bar + brand row.
- **Balance:** kicker "الرصيد المتاح", then the large tabular figure + "ريال سعودي" unit, sitting on the **ledger-total double rule**; account line ("حساب جارٍ — {name}") with masked customer ref at the end.
- **Primary action:** full-width **ink bar** button, crisp corners, letterspaced "تحويل جديد".
- **Payees:** ruled statement rows — margin index (01, 02), name (700), masked IBAN (mono, LTR, muted), label as plain letterspaced small-caps at the inline-end. Hairline dividers top and bottom. **No avatar circles, no pills.**
- **Colophon:** foot-of-page ruled block with the **seal mark** + one-line "محميّ بنظام درع — نراقب الإكراه لا الهوية." Replaces the soft footnote card.
- The long-press-to-open-demo-controls affordance moves onto the **nameplate/seal** (preserving the existing 550ms long-press behavior).

### 4.2 Transfer — a slip you fill out
- Editorial title: kicker "تحويل جديد" + heading "إلى مَن تُحوّل؟" (weight 900).
- **Fields as form-slip lines:** single **bottom-rule** inputs (no filled boxes), kicker labels above. IBAN mono/LTR; **amount oversized** (≈30px, 700) as the visual anchor.
- **Purpose picker:** a **ruled segmented control** (words divided by 1px ink rules, selected segment = ink fill), replacing pastel pills. Preserve the free-text input beneath as a bottom-rule field and the existing entry-method capture wiring.
- **Signals readout → telemetry strip:** a ruled region (heavy top rule, hairline rows) titled "إشارات مُلتقطة" with a small "مباشر/live" indicator. Each row: label + tabular value + a tiny `✓`/`⚠` mark. `⚠` warnings render in oxblood; everything else ink. Keep the existing explanatory footnote about which signals are real vs approximated.
- **Submit:** ink bar "متابعة التحويل"; loading state stays.
- **IBAN validation error** keeps its inline treatment but restyled to the new language (oxblood text + rule, no pastel box).

### 4.3 Intervention Chat — the centerpiece
- Enters via the slow paper-veil. This is a **distinct space:** no bottom nav, full bleed.
- **Header:** seal mark + "محادثة آمنة / درع · SHIELD", calm subtitle ("توقّفنا للحظة… خُذ وقتك — لا حاجة للعجلة"), capped by a **heavy 2px rule**.
- **Message treatment (the signature move):**
  - **Shield speaks as a printed editor's note** — typeset text on paper with a heavy **ink margin-rule** (inline-start border) and a small letterspaced "درع" label. **No bubble.**
  - **User replies are ink-filled blocks** on the opposite side, one corner softened (`rounded-[3px]` with one 12px corner).
  - Typing indicator: dots under a muted margin-rule (matches the note motif), not a bubble.
- **Composer:** bottom-rule text input + a small **ink square** send button (crisp). Keep Enter-to-send, min-pause `THINK_MS`, and the ASK/RESOLVED loop exactly as-is.

### 4.4 Result Screens — stamped receipts
- **GREEN (approved):** a **rotated ink stamp** "تمّت الموافقة" (green, double-ruled border) replacing the generic circle-check; then a **ledger receipt** — ruled rows for amount / beneficiary / reference; ghost outline "return home" button. Keeps the brief processing→confirm beat.
- **RED (blocked):** same stamp language in **oxblood** ("أُوقِف التحويل"); firm heading; the coercion-awareness text as a **margin-ruled aside** (oxblood inline-start border over `oxblood-soft`, the one intentional soft-fill because it must read as an alert); **report reference** in mono, set like an official document number on a ruled line. Keeps the AI final message and report reference from state.

### 4.5 Intel Dashboard — incidents broadsheet
- **Masthead:** "استخبارات الاحتيال" heading + a bordered "تحديث ↻" refresh control; heavy rule beneath. Keeps the 4s polling.
- **Feed:** each record is a **ruled incident row** with a colored ink **margin mark** (green/ochre/oxblood square by decision), a top line (state label in state color + time), masked IBAN + outcome (LTR), and a compact **tabular telemetry grid** (amount, account age, transit velocity, behavioral score, entry methods, idle, call, watchlist) with warn values in oxblood. Detected pattern renders as a **margin-ruled ochre aside**.
- **Playbook:** numbered editorial list — margin number (ochre, tabular) + ruled rows.
- Keeps the empty-state and error-state messages, restyled to the new language.

## 5. Component / Token Impact

- **`src/styles.css`:** add `--radius-sm: 3px`; add `.kicker::before` tick; add masthead-rule / ledger-rule / margin-rule utility classes (or express inline); add `stamp` keyframe; keep grain, `.tnum`, `.no-scrollbar`, existing animations.
- **`src/components/ui.tsx`:** `Button` gains letterspacing + crisp radius; `StateBadge` reworked from pastel pill toward ink margin-mark + state-colored label (or a second variant for the Intel margin mark); add a `Seal` mark component; `Kicker`/`Rule` largely reused.
- **`AppHeader.tsx`:** rewritten as the masthead (drop status-bar icons; dateline; long-press moves to nameplate/seal).
- **`BottomNav.tsx`:** ruled footer, ink-top-border active state, geometric marks.
- **`PhoneShell.tsx`:** unchanged structurally (frame/notch stay); minor token alignment only.
- **Screens:** `HomeScreen`, `TransferScreen`, `InterventionChat`, `ResultScreens`, `IntelDashboard` restyled/restructured per §4. **All hooks, state reads, `useSignalCapture`, API calls, and routing are preserved verbatim.**
- **Icons:** remove most `lucide-react` usage; it may remain a dependency for the few thin-stroke icons kept.

## 6. Explicit Non-Goals

- No changes to `AppContext`, `useSignalCapture`, `lib/api.ts`, `lib/types.ts`, `lib/seed.ts`, routing, the Vite proxy, or the API contract.
- No new dependencies (Cairo already loaded; work within Tailwind v4 `@theme`).
- No functional changes to the three seeded scenarios or the ASK/RESOLVED loop.

## 7. Verification

- Visual check at **narrow mobile width** (full-viewport, edge-to-edge, bottom nav, safe-area insets) and **wide desktop width** (centered phone frame + notch), matching the approved mockups.
- End-to-end re-run of all three scenarios (GREEN success / ORANGE→coached / RED mule block) plus invalid-IBAN field error and the `/intel` feed+playbook, confirming no logic regressed.
- `prefers-reduced-motion` disables stamp/veil animations.
- Existing puppeteer verification flow reused where practical.
