/**
 * Verdict share text — pure function, no DOM access.
 *
 * The shared/copied text carries the verdict + risk score, the one-line
 * summary, the red-flag count, and which path ran (on-device / cloud).
 * Unit-tested with plain node — see scripts/test-share-text.cjs.
 */
import { STRINGS } from '../i18n'
import type { UILanguage } from '../i18n'
import type { Verdict } from './verdict'

/**
 * Minimal shape buildResultShareText needs — AnalysisResult satisfies it.
 * Kept structural (instead of importing the type from hybrid.ts) so this
 * module stays free of the Firebase SDK and unit-testable with plain node.
 */
export interface ShareableResult {
  verdict: Verdict
  inferenceSource: 'on_device' | 'in_cloud' | 'unknown'
}

export function buildResultShareText(
  res: ShareableResult,
  language: UILanguage,
): string {
  const t = STRINGS[language]
  const label =
    res.verdict.verdict === 'scam'
      ? t.verdictScam
      : res.verdict.verdict === 'suspicious'
        ? t.verdictSuspicious
        : t.verdictSafe
  const source =
    res.inferenceSource === 'on_device'
      ? t.shareLineSourceOnDevice
      : t.shareLineSourceInCloud
  return [
    `${t.shareTitle} — ${label} (${t.scoreLabel}: ${res.verdict.score}/100)`,
    res.verdict.summary,
    t.shareLineFlags(res.verdict.redFlags.length),
    source,
  ].join('\n')
}
