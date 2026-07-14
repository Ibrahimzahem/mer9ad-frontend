# بنك المدى — Shield (درع) demo frontend

A fake mobile-banking app that demonstrates the **Shield** anti-social-engineering
(APP-fraud) backend end to end. Arabic-first, RTL, "ink on paper" aesthetic.

- **Mobile:** full-viewport, edge-to-edge native-app feel (fixed bottom nav, large
  tap targets, safe-area insets).
- **Desktop:** the same app rendered inside a centered **phone-frame** device mockup,
  so it reads clearly as a phone on a projector.

Same state + API logic in both; only the outer shell switches at the `md` breakpoint.

## Stack

React 19 + Vite + TypeScript, Tailwind CSS v4, plain React context/state, `fetch`.
No SSR, no Redux, no router library (a tiny history-based switch handles `/` vs `/intel`).

## Prerequisites

1. **Shield backend** running at `http://localhost:8080`:
   ```bash
   ./mvnw spring-boot:run
   ```
   It boots on `:8080`. CORS is only allowed for `http://localhost:5173`, so the
   frontend **must** run on port 5173.

2. Node 20+.

## Run

```bash
npm install
npm run dev        # → http://localhost:5173
```

Config lives in `.env` (`VITE_API_BASE=http://localhost:8080`). A `.env.example` is
provided.

To verify responsiveness: open `http://localhost:5173`, then toggle a narrow mobile
width (~390px) and a wide desktop width in dev tools — mobile is edge-to-edge, desktop
shows the phone frame.

## Demo controls

Open the discreet demo panel two ways:

- **Long-press the logo** (top-right), or
- append **`?demo`** to the URL: `http://localhost:5173/?demo`.

From there you can pick a scenario by real IBAN (prefills the transfer form and still
routes through the real signal-capture code), toggle the two browser-undetectable
signals (`activeCallDetected`, `remoteAccessAppDetected`), and reset state.

## Signal capture (real, not faked)

The Transfer screen actually measures what it sends:

- **`ibanEntryMethod` / `purposeEntryMethod`** — paste vs. typing (`onPaste` → `pasted`).
- **`purposeFilledAfterIbanMs`** — ms between last IBAN input and last purpose input.
- **`maxIdleGapMs`** — longest gap with no interaction on the transfer screen.
- **`cadenceDeviation` / `cadenceSamples`** — computed from real keystroke intervals.
- **`deviceInconsistency`** — **approximated** for a web demo (stated in the UI too).
- **`activeCallDetected` / `remoteAccessAppDetected`** — not browser-detectable → demo toggles.

## Demo walkthrough (three seeded scenarios, live backend)

Open `?demo` and run in order:

1. **GREEN** — pick *أخضر*. Transfer to `…1111`, amount 100, typed, benign signals →
   `GREEN / PROCEED`. Smooth success screen.
2. **ORANGE → intervention** — pick *برتقالي*. Transfer to `…2222`, amount 900, purpose
   `مصاريف عائلية` (pasted), `activeCallDetected` on → `ORANGE`, opens the calm secure
   chat seeded from the live `session.question`. Reply the coached line
   `مصاريف عائلية` a couple of times → Shield reflects the contradiction and resolves
   **RED** (block screen). Reply instead with a detailed, self-sourced, *consistent*
   story to steer it toward **GREEN**.
3. **RED (mule)** — pick *أحمر*. Transfer to `…3333` → immediate `RED / BLOCK_AND_REPORT`
   with a `reportReference`. Deterministic block, no chat.
4. Open **المركز → /intel** and watch it live-poll: the fraud-intel feed fills with the
   ORANGE/RED outcomes and the scam-script playbook grows when a fresh coaching pattern
   is learned.

Also try an **invalid IBAN** on the transfer screen (e.g. `SA00000000000003333`) → clean
inline field error (`رقم آيبان غير صالح`), no crash, no route change.

## Note on the live AI

The running backend is configured with a **real** AI (not the deterministic offline
stub), so intervention wording varies turn to turn and a convincing GREEN resolution
requires answers that stay **consistent** with the stated purpose. The UI simply loops
faithfully on the backend's `ASK` / `RESOLVED` contract — the mule (RED) and known-payee
(GREEN) paths remain deterministic.

## Project map

```
index.html                 RTL root, Arabic fonts (Amiri + IBM Plex Sans Arabic)
src/main.tsx               entry
src/App.tsx                shell + view switch (/ vs /intel)
src/styles.css             ink-on-paper Tailwind theme
src/state/AppContext.tsx   all app state (accounts, demo, view machine, outcomes)
src/signals/               real client signal capture
src/lib/                   api client, types, seed data, formatting
src/components/            PhoneShell, AppHeader, BottomNav, DemoControls, ui
src/screens/               Home, Transfer, InterventionChat, Result, IntelDashboard
```
