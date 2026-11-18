/**
 * Hybrid inference for CekTipu — the heart of the #BuildHybridAI entry.
 *
 * One `GenerativeModel` from Firebase AI Logic routes each request:
 *   - `PREFER_ON_DEVICE` (default): Gemini Nano on-device when available,
 *     cloud fallback (`gemini-3.5-flash-lite`, free tier) otherwise.
 *   - `ONLY_ON_DEVICE` (privacy mode): on-device only, never leaves the
 *     device. The message never leaves the user's browser.
 *
 * Every response carries `inferenceSource` (`on_device` / `in_cloud`) —
 * the UI shows it as a visible badge. That badge is the core demo moment.
 *
 * Rules enforced here:
 * - `initializeDeviceModel()` is only called from a user click (the
 *   "Prepare on-device model" button) — the Prompt API requires it.
 * - A 429 (free-tier exhausted) is NEVER hard-retried: the error is
 *   surfaced so the UI can suggest privacy mode / trying later.
 * - Short prompts keep cloud calls cheap and under free-tier limits.
 */
import { getGenerativeModel, InferenceMode } from 'firebase/ai'
import type { GenerativeModel } from 'firebase/ai'
import { initFirebase } from './firebase'
import { buildAnalysisPrompt, parseVerdict, verdictSchema } from './verdict'
import type { Verdict } from './verdict'

export type InferenceSourceLabel = 'on_device' | 'in_cloud' | 'unknown'

export type AnalyzeErrorKind =
  | 'not-configured'
  | 'rate-limited'
  | 'on-device-unavailable'
  | 'network'
  | 'parse'
  | 'unknown'

export class AnalyzeError extends Error {
  kind: AnalyzeErrorKind
  constructor(kind: AnalyzeErrorKind, message: string) {
    super(message)
    this.name = 'AnalyzeError'
    this.kind = kind
  }
}

export interface AnalysisResult {
  verdict: Verdict
  inferenceSource: InferenceSourceLabel
  privacyMode: boolean
}

/**
 * Cloud fallback model — verified current on 2026-11-18 against the
 * Firebase AI Logic docs. `gemini-2.5-*` models are deprecated and not
 * recommended for new projects, so they are deliberately NOT used here.
 * `gemini-3.5-flash-lite` is the cheapest/fastest current free-tier model.
 */
export const CLOUD_MODEL_ID = 'gemini-3.5-flash-lite'

interface CachedModel {
  privacyMode: boolean
  model: GenerativeModel
}

let cachedModel: CachedModel | null = null

function getModel(privacyMode: boolean): GenerativeModel {
  const init = initFirebase()
  if (init.status !== 'ready') {
    throw new AnalyzeError(
      'not-configured',
      'Firebase project is not configured yet. Create the project and fill in .env.local — see README.md.',
    )
  }
  if (cachedModel && cachedModel.privacyMode === privacyMode) {
    return cachedModel.model
  }
  const mode = privacyMode
    ? InferenceMode.ONLY_ON_DEVICE
    : InferenceMode.PREFER_ON_DEVICE
  const model = getGenerativeModel(init.ai, {
    mode,
    inCloudParams: {
      model: CLOUD_MODEL_ID,
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: verdictSchema,
        temperature: 0.2,
        maxOutputTokens: 1024,
      },
    },
  })
  cachedModel = { privacyMode, model }
  return model
}

/**
 * Pre-download / warm up the on-device model (Gemini Nano). MUST be called
 * from a user interaction (button click). Reports download progress 0–1.
 * Throws `AnalyzeError` with kind `on-device-unavailable` when this
 * browser cannot run the on-device model (non-Chrome, old Chrome, or the
 * Prompt API flag disabled).
 */
export async function prepareOnDeviceModel(
  privacyMode: boolean,
  onProgress?: (progress: number) => void,
): Promise<void> {
  const model = getModel(privacyMode)
  try {
    await model.initializeDeviceModel(onProgress)
  } catch (err) {
    throw new AnalyzeError(
      'on-device-unavailable',
      `On-device model could not be prepared: ${errorMessage(err)} ` +
        'Use Chrome Desktop 139+ with chrome://flags/#prompt-api-for-gemini-nano-multimodal-input enabled, or turn privacy mode off to use the cloud fallback.',
    )
  }
}

/** Analyze one message. Returns the verdict plus which path actually ran. */
export async function analyzeMessage(
  message: string,
  opts: { privacyMode: boolean; language: 'id' | 'en' },
): Promise<AnalysisResult> {
  const model = getModel(opts.privacyMode)
  const prompt = buildAnalysisPrompt(message, opts.language)

  let result
  try {
    result = await model.generateContent(prompt)
  } catch (err) {
    throw mapGenerateError(err, opts.privacyMode)
  }

  const response = result.response
  const rawText = response.text()
  const inferenceSource: InferenceSourceLabel =
    response.inferenceSource === 'on_device'
      ? 'on_device'
      : response.inferenceSource === 'in_cloud'
        ? 'in_cloud'
        : 'unknown'

  let verdict: Verdict
  try {
    verdict = parseVerdict(rawText)
  } catch (err) {
    throw new AnalyzeError(
      'parse',
      `Could not read the model's answer as a verdict: ${errorMessage(err)}`,
    )
  }

  return { verdict, inferenceSource, privacyMode: opts.privacyMode }
}

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  return String(err)
}

/**
 * Map a generateContent failure to a user-actionable error kind.
 * 429 / RESOURCE_EXHAUSTED is surfaced, never retried (free-tier quota).
 */
function mapGenerateError(err: unknown, privacyMode: boolean): AnalyzeError {
  const msg = errorMessage(err)
  if (/429|RESOURCE_EXHAUSTED|quota|rate limit/i.test(msg)) {
    return new AnalyzeError(
      'rate-limited',
      'Cloud free-tier quota is exhausted for now (429). Try privacy mode (on-device only) or try again later. The app never auto-retries a 429.',
    )
  }
  if (
    /on-device|on_device|not available|not supported|LanguageModel|Prompt API/i.test(
      msg,
    )
  ) {
    return new AnalyzeError(
      'on-device-unavailable',
      privacyMode
        ? 'On-device model is not available in this browser. Use Chrome Desktop 139+ with the Prompt API flag enabled.'
        : `On-device model is not available and the cloud fallback failed: ${msg}`,
    )
  }
  if (/fetch|network|Failed to fetch|offline/i.test(msg)) {
    return new AnalyzeError(
      'network',
      `Network error while contacting the model: ${msg}`,
    )
  }
  return new AnalyzeError('unknown', msg)
}
