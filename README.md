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

## Run it

```bash
npm install
npm run dev     # http://localhost:5173
npm run build   # type-check + production build
```

Requirements: Node 18+, Chrome Desktop 139+ for the on-device path
(any browser works — it just falls back to cloud).

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

## Project structure

```
src/
  lib/
    firebase.ts   # initializeApp + App Check + getAI (placeholder-safe)
    hybrid.ts     # getGenerativeModel, PREFER/ONLY_ON_DEVICE, inferenceSource
    verdict.ts    # JSON verdict schema + prompt + strict parser
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

## License

Apache License 2.0 — see [LICENSE](LICENSE).
