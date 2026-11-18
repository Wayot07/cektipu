/**
 * Verdict model for CekTipu: the structured JSON the AI must return,
 * the prompt that asks for it, and a strict parser/validator.
 *
 * Structured output (JSON + enum) is supported on-device by Gemini Nano
 * through the Prompt API, and in-cloud through `responseSchema`. The prompt
 * also instructs the model to output ONLY the JSON object, so both paths
 * produce parseable output even if the on-device path ignores the schema.
 */
import { Schema } from 'firebase/ai'

export type VerdictLabel = 'scam' | 'suspicious' | 'likely-safe'

export interface RedFlag {
  /** Exact short quote from the message. */
  quote: string
  /** Why this is suspicious, in one sentence. */
  reason: string
}

export interface Verdict {
  verdict: VerdictLabel
  /** Risk score 0 (clearly safe) → 100 (certainly a scam). */
  score: number
  redFlags: RedFlag[]
  /** A safe reply the user can send — or "ignore / report" advice. */
  suggestedReply: string
  /** One or two sentences explaining the verdict. */
  summary: string
}

/**
 * JSON schema sent to the cloud model via `generationConfig.responseSchema`
 * (see hybrid.ts). Keep in sync with `Verdict` above.
 */
export const verdictSchema = Schema.object({
  description: 'Structured scam-analysis verdict for one suspicious message.',
  properties: {
    verdict: Schema.enumString({
      description:
        'Overall verdict: "scam" (clear fraud attempt), "suspicious" (red flags but not conclusive), or "likely-safe" (no meaningful scam indicators).',
      enum: ['scam', 'suspicious', 'likely-safe'],
    }),
    score: Schema.integer({
      description:
        'Risk score from 0 (clearly safe) to 100 (certainly a scam).',
    }),
    redFlags: Schema.array({
      description:
        'Suspicious elements found in the message. Empty array when likely-safe.',
      items: Schema.object({
        description:
          'One red flag: an exact quote from the message and why it is suspicious.',
        properties: {
          quote: Schema.string({
            description: 'Exact short quote from the message.',
          }),
          reason: Schema.string({
            description: 'Why this is suspicious, in one sentence.',
          }),
        },
      }),
    }),
    suggestedReply: Schema.string({
      description:
        'A safe reply the user can send back, or advice to ignore and report the message. Same language as the message when possible.',
    }),
    summary: Schema.string({
      description: 'One or two sentences explaining the verdict.',
    }),
  },
})

const SYSTEM_PROMPT_ID = `Kamu adalah analis keamanan pesan. Tugasmu: menilai apakah sebuah pesan (WhatsApp/Telegram/SMS/email) adalah penipuan.

Aturan:
- Jawab HANYA dengan satu objek JSON yang cocok dengan skema: {"verdict": "scam" | "suspicious" | "likely-safe", "score": 0-100, "redFlags": [{"quote": "...", "reason": "..."}], "suggestedReply": "...", "summary": "..."}.
- Jangan tulis teks lain di luar JSON. Jangan pakai markdown.
- "verdict" = "scam" kalau ada indikasi penipuan yang jelas (hadiah palsu, tautan phishing, minta OTP/PIN, minta transfer, impersonasi). "suspicious" kalau ada tanda mencurigakan tapi belum konklusif. "likely-safe" kalau tidak ada indikator penipuan yang berarti.
- "score": 0-100. 90+ = hampir pasti penipuan, 60-89 = sangat mencurigakan, 30-59 = patut diwaspadai, 0-29 = kemungkinan besar aman.
- "redFlags": kutip PERSIS bagian pesan yang mencurigakan (maks 6 item), beserta alasannya. Kosongkan kalau likely-safe.
- "suggestedReply": balasan aman yang bisa dikirim pengguna, atau saran "Abaikan dan laporkan pesan ini." Pakai bahasa yang sama dengan pesan.
- "summary": penjelasan singkat 1-2 kalimat dalam Bahasa Indonesia.`

const SYSTEM_PROMPT_EN = `You are a message security analyst. Your task: judge whether a message (WhatsApp/Telegram/SMS/email) is a scam.

Rules:
- Answer ONLY with a single JSON object matching this schema: {"verdict": "scam" | "suspicious" | "likely-safe", "score": 0-100, "redFlags": [{"quote": "...", "reason": "..."}], "suggestedReply": "...", "summary": "..."}.
- Do not write any text outside the JSON. No markdown.
- "verdict" = "scam" when there is a clear fraud indicator (fake prize, phishing link, OTP/PIN request, money transfer request, impersonation). "suspicious" when there are warning signs but nothing conclusive. "likely-safe" when there is no meaningful scam indicator.
- "score": 0-100. 90+ = almost certainly a scam, 60-89 = highly suspicious, 30-59 = worth caution, 0-29 = most likely safe.
- "redFlags": quote EXACTLY the suspicious parts of the message (max 6 items) with a reason for each. Empty when likely-safe.
- "suggestedReply": a safe reply the user can send back, or advice to ignore and report the message. Use the same language as the message when possible.
- "summary": a brief 1-2 sentence explanation in English.`

export function buildAnalysisPrompt(
  message: string,
  language: 'id' | 'en',
): string {
  const system = language === 'id' ? SYSTEM_PROMPT_ID : SYSTEM_PROMPT_EN
  return `${system}\n\nPesan yang dianalisis / Message to analyze:\n"""\n${message}\n"""`
}

/** Extract the first JSON object from raw model output and validate it. */
export function parseVerdict(rawText: string): Verdict {
  const start = rawText.indexOf('{')
  const end = rawText.lastIndexOf('}')
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('Model output did not contain a JSON object.')
  }
  let parsed: unknown
  try {
    parsed = JSON.parse(rawText.slice(start, end + 1))
  } catch {
    throw new Error('Model output was not valid JSON.')
  }
  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('Model output was not a JSON object.')
  }
  const obj = parsed as Record<string, unknown>

  const verdict = obj.verdict
  if (verdict !== 'scam' && verdict !== 'suspicious' && verdict !== 'likely-safe') {
    throw new Error(`Invalid verdict value: ${String(verdict)}`)
  }
  const scoreRaw = obj.score
  if (typeof scoreRaw !== 'number' || Number.isNaN(scoreRaw)) {
    throw new Error('Invalid score value.')
  }
  const score = Math.max(0, Math.min(100, Math.round(scoreRaw)))

  const flagsRaw = obj.redFlags
  const redFlags: RedFlag[] = []
  if (Array.isArray(flagsRaw)) {
    for (const item of flagsRaw.slice(0, 6)) {
      if (
        typeof item === 'object' &&
        item !== null &&
        typeof (item as Record<string, unknown>).quote === 'string' &&
        typeof (item as Record<string, unknown>).reason === 'string'
      ) {
        redFlags.push({
          quote: (item as Record<string, unknown>).quote as string,
          reason: (item as Record<string, unknown>).reason as string,
        })
      }
    }
  }

  return {
    verdict,
    score,
    redFlags,
    suggestedReply:
      typeof obj.suggestedReply === 'string' ? obj.suggestedReply : '',
    summary: typeof obj.summary === 'string' ? obj.summary : '',
  }
}
