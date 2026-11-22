# CekTipu — Private On-Device Scam Checker

> **#BuildHybridAI 2026 entry (Web/Chrome)** — paste a suspicious WhatsApp,
> Telegram, or SMS message and get an instant scam verdict, privately on
> your own device.

![License: Apache-2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)
![Firebase AI Logic](https://img.shields.io/badge/Firebase_AI_Logic-hybrid_inference-orange.svg)
![Platform: Web](https://img.shields.io/badge/Platform-Web_Chrome-green.svg)

## What it does

Scam messages often contain personal data — so CekTipu analyzes them
**on-device first**:

1. **Paste a message** (Bahasa Indonesia or English) and tap **Analyze**.
2. Get a structured verdict: `scam / suspicious / likely-safe`, a risk
   score (0–100), the exact red-flag quotes with reasons, and a suggested
   safe reply.
3. **Every result shows a badge** — 📱 `ON-DEVICE` (Gemini Nano, analyzed
   locally, the message never left the browser) or ☁️ `CLOUD` (Gemini
   Flash-Lite fallback for hard cases or when Nano is unavailable).
4. **Privacy mode** forces `ONLY_ON_DEVICE` — nothing ever leaves the device.
5. **12 built-in scam examples** (fake prize, fake bank, fake job, crypto
   doubling, fake delivery, impersonation, …) as one-tap chips — great for
   trying the app without typing.
6. **History** is stored in `localStorage` only — on your device, nowhere else.
7. **Share the verdict** — the result card has **Share result** (Web Share
   API where the browser offers it) and **Copy result** buttons; the shared
   text carries the verdict, risk score, summary, red-flag count, and
   whether it ran on-device or in the cloud.
8. **Clear error states** — when Gemini Nano is unavailable in the browser,
   while it is downloading, or when you are offline, the app says so
   plainly and tells you what still works (cloud while Nano is missing,
   on-device while offline once the model is ready).

## How hybrid inference is used (Firebase AI Logic)

One `GenerativeModel` from the Firebase AI Logic JS SDK
(`firebase/ai`, v13.4.0) does the routing — see
[`src/lib/hybrid.ts`](src/lib/hybrid.ts):

```ts
import { getAI, GoogleAIBackend, getGenerativeModel, InferenceMode } from 'firebase/ai'

const ai = getAI(app, { backend: new GoogleAIBackend() }) // free tier, no billing
const model = getGenerativeModel(ai, {
  mode: InferenceMode.PREFER_ON_DEVICE, // or ONLY_ON_DEVICE in privacy mode
  inCloudParams: {
    model: 'gemini-3.5-flash-lite',
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: verdictSchema, // structured JSON output
    },
  },
})

// Must run on a user click (Prompt API rule):
await model.initializeDeviceModel((progress) => /* download % */)

const result = await model.generateContent(prompt)
const source = result.response.inferenceSource // 'on_device' | 'in_cloud'
```

- **On-device (Gemini Nano, Chrome Prompt API):** short messages are
  classified locally. Structured JSON output is supported on-device; the
  prompt also instructs the model to output JSON only.
- **Cloud fallback (`gemini-3.5-flash-lite`):** longer or more ambiguous
  messages, or when Nano is unavailable. Verified current on 2026-11-18
  against the Firebase AI Logic docs — `gemini-2.5-*` models are
  deprecated and are deliberately **not** used.
- **429 handling:** a free-tier `429 RESOURCE_EXHAUSTED` is surfaced to
  the user (suggesting privacy mode / retry later). The app **never**
  hard-retries a 429.
- **App Check** is initialized in [`src/lib/firebase.ts`](src/lib/firebase.ts)
  (debug provider for local dev, reCAPTCHA Enterprise for production).

## Error states

The app never leaves you guessing when a path cannot run:

| Situation | What you see | What still works |
| --- | --- | --- |
| **Nano unavailable** (non-Chrome, old Chrome, Prompt API flag off) | Amber notice in the on-device card: why it is unavailable, and that the cloud still works | Full analysis via the cloud; the badge reads ☁️ `CLOUD` |
| **Nano downloading** | Live progress bar + % in the on-device card | Analysis already works via the cloud while the download finishes |
| **Offline** | Notice above the input: cloud unavailable, on-device only | On-device analysis once the model is ready (green notice); if the model is not ready yet, the notice says analysis may fail until you are back online |
| **Cloud quota exhausted (429)** | Error message after analysis; the app falls back once to on-device and says so | On-device analysis; the app never hard-retries the cloud |

## Run it

```bash
npm install
npm run dev     # http://localhost:5173
npm run build   # type-check + production build
```

Requirements: Node 22+ (Vite 8 needs Node 20.19+ / 22.12+), Chrome Desktop
139+ for the on-device path (any browser works — it just falls back to
cloud).

## Setting up the Firebase project (5 minutes, free, no credit card)

The app ships with a **placeholder Firebase config** and shows a clear
"Firebase project not configured yet" banner until this is done. It never
crashes without a config.

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
   and create a project (free **Spark** plan — no card required).
2. **Build → AI Logic → Get started** → choose **Gemini Developer API**
   (free tier, no billing account).
3. In the Firebase console: **Project settings → Your apps → Web app** →
   copy the web config values.
4. Copy `.env.example` to `.env.local` and fill in the six
   `VITE_FIREBASE_*` values.
5. **App Check (local dev):** keep `VITE_APPCHECK_DEBUG_TOKEN=true` in
   `.env.local`. Run the app once — the SDK prints a debug token to the
   browser console. Register it in the console under
   **App Check → Apps → Manage debug tokens**. (Never commit the token —
   `.env.local` is git-ignored.)
6. Restart `npm run dev`. Paste a message or tap an example chip and hit
   **Analyze**.

### Enabling the on-device model in Chrome

1. Open `chrome://flags/#prompt-api-for-gemini-nano-multimodal-input` and
   set it to **Enabled**, then relaunch Chrome.
2. In the app, click **"Prepare on-device model"** and wait for the
   download (one-time, a few hundred MB). The button shows live progress.
3. Analyze a message — the result badge should read 📱 `ON-DEVICE`.

If Nano is unavailable (non-Chrome browser, old Chrome, no storage),
analysis still works via the cloud fallback and the badge reads ☁️ `CLOUD`.

## Testing instructions (for judges)

1. Open the hosted URL in **Chrome Desktop 139+** (or run locally with
   `npm run dev`).
2. Tap any example chip (e.g. **Hadiah palsu** or **Gandakan kripto**),
   then **Analyze Pesan**.
3. Watch the result card: verdict + score, red flags with quotes,
   suggested reply, and the **ON-DEVICE / CLOUD badge**.
4. Toggle **Mode privasi** (privacy mode) on and analyze again — the
   badge must read ON-DEVICE and the message never leaves the device.
5. Switch the language toggle **ID / EN** — the whole UI translates.
6. To see the cloud path on purpose: use a non-Chrome browser, or a
   Chrome profile where the Prompt API flag is off — the badge reads CLOUD.
7. **Share the verdict:** after a result appears, tap **Share result** (on
   a phone it opens the system share sheet) or **Copy result** — the
   copied text carries the verdict, score, summary, red-flag count, and
   the ON-DEVICE / CLOUD source.
8. **Offline:** turn on airplane mode (or DevTools → Network → Offline),
   then reload. The notice above the input explains that only on-device
   works. If the model is ready, analyze a message — it still works,
   fully private. If the model is not ready, the notice says analysis may
   fail until you are back online.
9. **Nano unavailable:** open the app in a non-Chrome browser (or a
   Chrome profile with the Prompt API flag off). The on-device card shows
   an amber notice explaining why Nano is unavailable — and analysis still
   works via the cloud.
10. **Nano downloading:** in a fresh Chrome profile, enable the flag, click
    **Prepare on-device model**, and watch the live progress bar. While it
    downloads, analysis already works via the cloud.
11. **Share-text unit test (no browser needed):**
    ```bash
    npx tsc src/lib/share.ts --ignoreConfig --outDir /tmp/share-test-out --module commonjs --target es2022 --skipLibCheck
    node scripts/test-share-text.cjs   # expect: 22 passed, 0 failed
    ```

## Project structure

```
src/
  lib/
    firebase.ts   # initializeApp + App Check + getAI (placeholder-safe)
    hybrid.ts     # getGenerativeModel, PREFER/ONLY_ON_DEVICE, inferenceSource
    verdict.ts    # JSON verdict schema + prompt + strict parser
    share.ts      # verdict share text (pure function, unit-tested with node)
    history.ts    # localStorage history (device-only)
  data/
    scam-examples.ts  # 12 built-in scam archetypes (ID + EN)
  i18n.ts         # Bahasa Indonesia + English UI strings
  App.tsx         # one-screen product UI
```

## Hackathon

Built for **#BuildHybridAI 2026** — Gen AI apps with Firebase AI Logic
(Gemini Nano on-device + cloud fallback). Platform: **Web (Chrome)**.
Submission deadline: 1 Dec 2026 05:00 WIB.

## Ringkasan (Bahasa Indonesia)

CekTipu mengecek pesan mencurigakan (WhatsApp / Telegram / SMS) dan memberi
verdict penipuan atau bukan — diutamakan on-device (Gemini Nano, privat),
dengan cloud sebagai cadangan. Semua instruksi di atas berlaku sama;
bagian "Testing instructions" menjelaskan cara menguji setiap jalurnya
(on-device, cloud, offline, Nano tidak tersedia, dan berbagi hasil).

## License

Apache License 2.0 — see [LICENSE](LICENSE).
