/**
 * Firebase initialization for CekTipu.
 *
 * The Firebase web config is read from Vite env vars (see `.env.example`).
 * Until Wahyu creates the Firebase project and fills them in, the config
 * stays on the PLACEHOLDER values below and `isFirebaseConfigured` is false.
 * The app must NEVER crash in that state — it shows a clear
 * "Firebase project not configured yet" banner instead (see App.tsx).
 *
 * No secrets live here: a Firebase *web* config (apiKey, projectId, ...)
 * is public-by-design. The real protection is Firebase App Check, which is
 * auto-enforced for AI Logic. NEVER commit App Check debug tokens or any
 * private key — debug tokens belong in `.env.local` only (git-ignored).
 */
import { initializeApp } from 'firebase/app'
import type { FirebaseApp, FirebaseOptions } from 'firebase/app'
import { getAI, GoogleAIBackend } from 'firebase/ai'
import type { AI } from 'firebase/ai'
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check'

const env = import.meta.env

/**
 * PLACEHOLDER config — replace via `.env.local` (copy from `.env.example`).
 * Values starting with `YOUR_` mean "not configured yet".
 */
export const firebaseConfig: FirebaseOptions = {
  apiKey: (env.VITE_FIREBASE_API_KEY as string | undefined) ?? 'YOUR_API_KEY',
  authDomain:
    (env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined) ??
    'YOUR_PROJECT_ID.firebaseapp.com',
  projectId:
    (env.VITE_FIREBASE_PROJECT_ID as string | undefined) ?? 'YOUR_PROJECT_ID',
  storageBucket:
    (env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined) ??
    'YOUR_PROJECT_ID.firebasestorage.app',
  messagingSenderId:
    (env.VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined) ??
    'YOUR_MESSAGING_SENDER_ID',
  appId: (env.VITE_FIREBASE_APP_ID as string | undefined) ?? 'YOUR_APP_ID',
}

/** True only once a real Firebase project config has been supplied. */
export const isFirebaseConfigured: boolean = !String(
  firebaseConfig.apiKey ?? '',
).startsWith('YOUR_')

export type FirebaseInit =
  | { status: 'not-configured' }
  | { status: 'ready'; app: FirebaseApp; ai: AI }

let cached: FirebaseInit | null = null

/**
 * Initialize Firebase (app + App Check + AI Logic) once, lazily.
 * Safe to call when not configured — returns `{ status: 'not-configured' }`
 * and initializes nothing.
 */
export function initFirebase(): FirebaseInit {
  if (cached) return cached

  if (!isFirebaseConfigured) {
    cached = { status: 'not-configured' }
    return cached
  }

  const app = initializeApp(firebaseConfig)

  // --- App Check -----------------------------------------------------------
  // AI Logic is App Check enforced. For local dev, set
  // VITE_APPCHECK_DEBUG_TOKEN=true in `.env.local`: the SDK then uses the
  // debug provider (and prints the debug token to the console — register it
  // in the Firebase console). For production, set
  // VITE_RECAPTCHA_ENTERPRISE_SITE_KEY to a real reCAPTCHA Enterprise key.
  // If neither is set we skip App Check and warn loudly; AI calls may then
  // be rejected by enforcement — see README.md.
  const siteKey = env.VITE_RECAPTCHA_ENTERPRISE_SITE_KEY as string | undefined
  const debugToken = env.VITE_APPCHECK_DEBUG_TOKEN as string | undefined
  try {
    if (debugToken) {
      ;(self as unknown as Record<string, unknown>).FIREBASE_APPCHECK_DEBUG_TOKEN =
        debugToken === 'true' ? true : debugToken
      initializeAppCheck(app, {
        provider: new ReCaptchaEnterpriseProvider(
          siteKey ?? 'debug-placeholder-key',
        ),
        isTokenAutoRefreshEnabled: true,
      })
    } else if (siteKey) {
      initializeAppCheck(app, {
        provider: new ReCaptchaEnterpriseProvider(siteKey),
        isTokenAutoRefreshEnabled: true,
      })
    } else {
      console.warn(
        '[CekTipu] No App Check provider configured. Set VITE_APPCHECK_DEBUG_TOKEN=true for local dev or VITE_RECAPTCHA_ENTERPRISE_SITE_KEY for production — AI Logic calls may be rejected without App Check.',
      )
    }
  } catch (err) {
    console.warn('[CekTipu] App Check init failed:', err)
  }

  // Gemini Developer API backend = free tier, no billing account needed.
  const ai = getAI(app, { backend: new GoogleAIBackend() })
  cached = { status: 'ready', app, ai }
  return cached
}
