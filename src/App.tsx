/**
 * CekTipu — private on-device scam-message checker.
 * #BuildHybridAI 2026 entry (Web/Chrome) — Firebase AI Logic hybrid inference.
 *
 * Single-screen product:
 *  paste a suspicious message → structured verdict (scam / suspicious /
 *  likely-safe) with risk score, red flags, and a suggested safe reply.
 *  Every result shows which path ran: ON-DEVICE (Gemini Nano) or CLOUD
 *  (Gemini Flash-Lite). Privacy mode forces ONLY_ON_DEVICE.
 */
import { useEffect, useRef, useState } from 'react'
import { SCAM_EXAMPLES } from './data/scam-examples'
import { STRINGS } from './i18n'
import type { UILanguage } from './i18n'
import { isFirebaseConfigured } from './lib/firebase'
import {
  AnalyzeError,
  analyzeMessage,
  prepareOnDeviceModel,
} from './lib/hybrid'
import type { AnalysisResult, AnalyzeErrorKind } from './lib/hybrid'
import { addHistoryEntry, clearHistory, loadHistory } from './lib/history'
import type { HistoryEntry } from './lib/history'
import { buildResultShareText } from './lib/share'
import type { VerdictLabel } from './lib/verdict'

const MAX_MESSAGE_LENGTH = 4000

type DeviceStatus =
  | 'idle'
  | 'downloading'
  | 'ready'
  | 'unsupported'
  | 'error'

const VERDICT_STYLE: Record<
  VerdictLabel,
  { badge: string; card: string; bar: string }
> = {
  scam: {
    badge: 'bg-red-600 text-white',
    card: 'border-red-300 bg-red-50 dark:border-red-900 dark:bg-red-950/40',
    bar: 'bg-red-500',
  },
  suspicious: {
    badge: 'bg-amber-500 text-white',
    card: 'border-amber-300 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40',
    bar: 'bg-amber-500',
  },
  'likely-safe': {
    badge: 'bg-emerald-600 text-white',
    card: 'border-emerald-300 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/40',
    bar: 'bg-emerald-500',
  },
}

function scoreColor(score: number): string {
  if (score >= 70) return 'bg-red-500'
  if (score >= 40) return 'bg-amber-500'
  return 'bg-emerald-500'
}

function detectPromptApi(): boolean {
  return (
    typeof window !== 'undefined' &&
    'LanguageModel' in window &&
    typeof (window as unknown as Record<string, unknown>).LanguageModel !==
      'undefined'
  )
}

export default function App() {
  const [language, setLanguage] = useState<UILanguage>('id')
  const [privacyMode, setPrivacyMode] = useState(false)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [errorKind, setErrorKind] = useState<AnalyzeErrorKind | null>(null)
  const [deviceStatus, setDeviceStatus] = useState<DeviceStatus>('idle')
  const [deviceProgress, setDeviceProgress] = useState(0)
  const [history, setHistory] = useState<HistoryEntry[]>(() => loadHistory())
  const [copied, setCopied] = useState(false)
  const [shareFeedback, setShareFeedback] = useState<'shared' | 'copied' | null>(
    null,
  )
  const [promptApiDetected] = useState(detectPromptApi)
  const resultRef = useRef<HTMLElement | null>(null)
  const [online, setOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  )

  const t = STRINGS[language]
  const configured = isFirebaseConfigured

  // Track connectivity: when offline, the cloud fallback is unavailable
  // and only the on-device model can run.
  useEffect(() => {
    const goOnline = () => setOnline(true)
    const goOffline = () => setOnline(false)
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])

  // Bring the verdict into view when it appears (nearest = no jump when
  // it is already visible on a tall screen).
  useEffect(() => {
    if (result) {
      resultRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      })
    }
  }, [result])

  async function handleAnalyze() {
    const text = message.trim()
    if (!text || busy) return
    if (!configured) {
      setErrorKind('not-configured')
      return
    }
    setBusy(true)
    setErrorKind(null)
    setResult(null)
    try {
      const res = await analyzeMessage(text, { privacyMode, language })
      setResult(res)
      setHistory(
        addHistoryEntry({
          message: text,
          preview: text.slice(0, 120),
          verdict: res.verdict.verdict,
          score: res.verdict.score,
          inferenceSource: res.inferenceSource,
          privacyMode,
          language,
        }),
      )
    } catch (err) {
      if (err instanceof AnalyzeError) setErrorKind(err.kind)
      else setErrorKind('unknown')
    } finally {
      setBusy(false)
    }
  }

  async function handlePrepareModel() {
    if (!configured) {
      setDeviceStatus('error')
      return
    }
    setDeviceStatus('downloading')
    setDeviceProgress(0)
    try {
      await prepareOnDeviceModel(privacyMode, (p) =>
        setDeviceProgress(Math.round(p * 100)),
      )
      setDeviceStatus('ready')
    } catch {
      setDeviceStatus('unsupported')
    }
  }

  function handleExample(id: string) {
    const ex = SCAM_EXAMPLES.find((e) => e.id === id)
    if (!ex) return
    setMessage(ex.text)
    setResult(null)
    setErrorKind(null)
    document
      .getElementById('message-input')
      ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  async function handleCopyReply(text: string) {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard unavailable — user can select the text manually.
    }
  }

  // Clipboard write with a textarea fallback for browsers where the
  // async Clipboard API is unavailable or denied.
  async function copyTextWithFallback(text: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      try {
        const ta = document.createElement('textarea')
        ta.value = text
        ta.style.position = 'fixed'
        ta.style.opacity = '0'
        document.body.appendChild(ta)
        ta.select()
        const ok = document.execCommand('copy')
        document.body.removeChild(ta)
        return ok
      } catch {
        return false
      }
    }
  }

  function flashShareFeedback(kind: 'shared' | 'copied') {
    setShareFeedback(kind)
    window.setTimeout(() => setShareFeedback(null), 2000)
  }

  async function handleCopyResult() {
    if (!result) return
    const ok = await copyTextWithFallback(buildResultShareText(result, language))
    if (ok) flashShareFeedback('copied')
  }

  async function handleShareResult() {
    if (!result) return
    const text = buildResultShareText(result, language)
    // Web Share API where the browser offers it (mostly mobile); otherwise
    // fall back to copying the same text to the clipboard.
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share({ title: t.shareTitle, text })
        flashShareFeedback('shared')
      } catch {
        // User cancelled the share sheet — nothing to report.
      }
    } else {
      await handleCopyResult()
    }
  }

  function errorText(kind: AnalyzeErrorKind): string {
    switch (kind) {
      case 'not-configured':
        return t.errNotConfigured
      case 'rate-limited':
        return t.errRateLimited
      case 'on-device-unavailable':
        return t.errOnDevice
      case 'network':
        return t.errNetwork
      case 'parse':
        return t.errParse
      default:
        return t.errUnknown
    }
  }

  const verdictLabel = result
    ? result.verdict.verdict === 'scam'
      ? t.verdictScam
      : result.verdict.verdict === 'suspicious'
        ? t.verdictSuspicious
        : t.verdictSafe
    : ''
  const verdictStyle = result
    ? VERDICT_STYLE[result.verdict.verdict]
    : VERDICT_STYLE['likely-safe']

  // On-device model cannot run in this browser (no Prompt API, or the
  // prepare step failed) — the cloud path still works, so say so clearly.
  const deviceUnavailable =
    deviceStatus === 'unsupported' ||
    (deviceStatus === 'idle' && !promptApiDetected)

  return (
    <div className="min-h-dvh bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <main className="mx-auto w-full max-w-3xl px-3 pb-10 pt-4 sm:px-4 sm:pb-16 sm:pt-8">
        {/* Header */}
        <header className="mb-4 text-center sm:mb-6">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            🛡️ CekTipu
          </h1>
          <p className="mt-1.5 text-sm text-zinc-600 dark:text-zinc-400 sm:mt-2 sm:text-base">
            {t.tagline}
          </p>
          <p className="mx-auto mt-1.5 line-clamp-2 max-w-xl text-xs text-zinc-500 dark:text-zinc-500 sm:mt-2 sm:line-clamp-none sm:text-sm">
            {t.subline}
          </p>
          <div className="mt-3 flex items-center justify-center gap-2 sm:mt-4">
            <div
              className="inline-flex rounded-full border border-zinc-300 p-0.5 dark:border-zinc-700"
              role="group"
              aria-label="Language / Bahasa"
            >
              {(['id', 'en'] as UILanguage[]).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setLanguage(lang)}
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold sm:px-3 sm:text-sm ${
                    language === lang
                      ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                      : 'text-zinc-600 dark:text-zinc-300'
                  }`}
                >
                  {lang === 'id' ? 'ID' : 'EN'}
                </button>
              ))}
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={privacyMode}
              onClick={() => setPrivacyMode((v) => !v)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold sm:gap-2 sm:px-3 sm:py-1.5 sm:text-sm ${
                privacyMode
                  ? 'border-emerald-600 bg-emerald-600 text-white'
                  : 'border-zinc-300 bg-white text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200'
              }`}
              title={t.privacyModeHint}
            >
              <span aria-hidden="true">{privacyMode ? '🔒' : '🔓'}</span>
              {t.privacyMode}
            </button>
          </div>
          {privacyMode && (
            <p className="mt-2 text-xs font-medium text-emerald-700 dark:text-emerald-400">
              {t.privacyModeHint}
            </p>
          )}
        </header>

        {/* Firebase not configured */}
        {!configured && (
          <section
            className="mb-4 rounded-2xl border border-amber-300 bg-amber-50 p-3 sm:mb-6 sm:p-4 dark:border-amber-900 dark:bg-amber-950/40"
            role="alert"
          >
            <h2 className="text-base font-bold text-amber-900 dark:text-amber-200">
              ⚠️ {t.notConfiguredTitle}
            </h2>
            <p className="mt-1 text-sm text-amber-800 dark:text-amber-300">
              {t.notConfiguredBody}
            </p>
            <p className="mt-1 text-sm font-medium text-amber-800 dark:text-amber-300">
              {t.notConfiguredSteps}
            </p>
          </section>
        )}

        {/* On-device model — compact status strip so the analyzer stays
            above the fold on small phones. */}
        <section className="mb-4 rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm sm:mb-6 sm:p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-sm font-bold sm:text-base">📱 {t.deviceTitle}</h2>
          <p className="mt-1 line-clamp-2 text-xs text-zinc-600 sm:line-clamp-none sm:text-sm dark:text-zinc-400">
            {t.deviceBody}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handlePrepareModel}
              disabled={!configured || deviceStatus === 'downloading'}
              className="rounded-full bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40 sm:px-4 sm:py-2 sm:text-sm dark:bg-white dark:text-zinc-900"
            >
              {deviceStatus === 'downloading'
                ? t.preparingModel
                : t.prepareButton}
            </button>
            <span className="text-xs text-zinc-600 sm:text-sm dark:text-zinc-400">
              {deviceStatus === 'ready' && `✅ ${t.deviceReady}`}
              {deviceStatus === 'downloading' &&
                `⏳ ${t.deviceDownloading(deviceProgress)}`}
              {deviceStatus === 'unsupported' && `⚠️ ${t.deviceUnsupported}`}
              {deviceStatus === 'idle' &&
                (promptApiDetected
                  ? `ℹ️ ${t.deviceIdle}`
                  : `⚠️ ${t.deviceUnsupported}`)}
              {deviceStatus === 'error' && `⚠️ ${t.errNotConfigured}`}
            </span>
          </div>
          {deviceStatus === 'downloading' && (
            <>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
                <div
                  className="h-full bg-emerald-500 transition-all"
                  style={{ width: `${deviceProgress}%` }}
                />
              </div>
              {online && (
                <p className="mt-2 text-xs text-zinc-600 sm:text-sm dark:text-zinc-400">
                  ℹ️ {t.deviceDownloadingHint}
                </p>
              )}
            </>
          )}
          {deviceUnavailable && (
            <div
              className="mt-3 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300"
              role="status"
            >
              <p className="font-bold">
                ⚠️ {t.deviceUnavailableTitle}
              </p>
              <p className="mt-1">{t.deviceUnavailableBody}</p>
            </div>
          )}
        </section>

        {/* Analyzer */}
        <section className="mb-4 rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm sm:mb-6 sm:p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <label
            htmlFor="message-input"
            className="mb-2 block text-sm font-bold"
          >
            {t.pasteLabel}
          </label>
          {!online && (
            <p
              className={`mb-2 rounded-xl border p-2.5 text-sm ${
                deviceStatus === 'ready'
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300'
                  : 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300'
              }`}
              role="status"
            >
              📶{' '}
              {deviceStatus === 'ready'
                ? t.offlineDeviceReady
                : `${t.offlineNotice} ${t.offlineDeviceNotReady}`}
            </p>
          )}
          <textarea
            id="message-input"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t.placeholder}
            maxLength={MAX_MESSAGE_LENGTH}
            rows={4}
            className="max-h-44 w-full rounded-xl border border-zinc-300 bg-white p-3 text-base outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:border-white"
          />
          <div className="mt-1 flex items-center justify-between text-xs text-zinc-500">
            <span>{t.charCount(message.length, MAX_MESSAGE_LENGTH)}</span>
            {privacyMode && <span>🔒 {t.badgeOnDevice}</span>}
          </div>
          <button
            type="button"
            onClick={handleAnalyze}
            disabled={!message.trim() || busy || !configured}
            className="mt-3 w-full rounded-full bg-emerald-600 px-4 py-3 text-base font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy ? t.analyzing : t.analyze}
          </button>

          {errorKind && (
            <p
              className="mt-3 rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
              role="alert"
            >
              ⚠️ {errorText(errorKind)}
            </p>
          )}

          <div className="mt-5">
            <p className="mb-2 text-sm font-bold">{t.examplesTitle}</p>
            {/* One horizontal scroll row on small screens instead of a
                wrapping block, so the examples don't push the page long. */}
            <div className="no-scrollbar flex snap-x gap-2 overflow-x-auto pb-1">
              {SCAM_EXAMPLES.map((ex) => (
                <button
                  key={ex.id}
                  type="button"
                  onClick={() => handleExample(ex.id)}
                  className="shrink-0 snap-start whitespace-nowrap rounded-full border border-zinc-300 bg-zinc-50 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                  title={`${ex.category} · ${ex.language.toUpperCase()}`}
                >
                  {ex.title} · {ex.language.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Result */}
        {result && (
          <section
            ref={resultRef}
            className={`mb-4 rounded-2xl border p-3 shadow-sm sm:mb-6 sm:p-4 ${verdictStyle.card}`}
            aria-live="polite"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-base font-bold">{t.resultTitle}</h2>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                  result.inferenceSource === 'on_device'
                    ? 'bg-emerald-600 text-white'
                    : result.inferenceSource === 'in_cloud'
                      ? 'bg-sky-600 text-white'
                      : 'bg-zinc-500 text-white'
                }`}
                title={
                  result.inferenceSource === 'on_device'
                    ? t.badgeOnDeviceHint
                    : result.inferenceSource === 'in_cloud'
                      ? t.badgeInCloudHint
                      : ''
                }
              >
                {result.inferenceSource === 'on_device'
                  ? `📱 ${t.badgeOnDevice}`
                  : result.inferenceSource === 'in_cloud'
                    ? `☁️ ${t.badgeInCloud}`
                    : t.badgeUnknown}
              </span>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-3">
              <span
                className={`rounded-full px-4 py-1.5 text-sm font-extrabold ${verdictStyle.badge}`}
              >
                {verdictLabel}
              </span>
              <span className="text-sm font-medium">
                {t.scoreLabel}: <strong>{result.verdict.score}/100</strong>
              </span>
            </div>
            {result.fellBackToDevice && (
              <p className="mt-2 rounded-xl border border-sky-300 bg-sky-50 p-2.5 text-sm text-sky-800 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-300">
                ☁️➡️📱 {t.fallbackNote}
              </p>
            )}
            <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
              <div
                className={`h-full ${scoreColor(result.verdict.score)}`}
                style={{ width: `${result.verdict.score}%` }}
              />
            </div>

            <h3 className="mt-4 text-sm font-bold">{t.summaryTitle}</h3>
            <p className="mt-1 text-sm">{result.verdict.summary}</p>

            <h3 className="mt-4 text-sm font-bold">{t.redFlagsTitle}</h3>
            {result.verdict.redFlags.length === 0 ? (
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                {t.noRedFlags}
              </p>
            ) : (
              <ul className="mt-1 space-y-2">
                {result.verdict.redFlags.map((flag, i) => (
                  <li
                    key={i}
                    className="rounded-xl border border-zinc-200 bg-white/70 p-3 text-sm dark:border-zinc-700 dark:bg-zinc-900/60"
                  >
                    <blockquote className="font-medium italic">
                      “{flag.quote}”
                    </blockquote>
                    <p className="mt-1 text-zinc-600 dark:text-zinc-400">
                      {flag.reason}
                    </p>
                  </li>
                ))}
              </ul>
            )}

            {result.verdict.suggestedReply && (
              <>
                <h3 className="mt-4 text-sm font-bold">
                  {t.suggestedReplyTitle}
                </h3>
                <p className="mt-1 rounded-xl border border-zinc-200 bg-white/70 p-3 text-sm dark:border-zinc-700 dark:bg-zinc-900/60">
                  {result.verdict.suggestedReply}
                </p>
                <button
                  type="button"
                  onClick={() => handleCopyReply(result.verdict.suggestedReply)}
                  className="mt-2 rounded-full border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold dark:border-zinc-700 dark:bg-zinc-900"
                >
                  {copied ? `✅ ${t.copied}` : `📋 ${t.copyReply}`}
                </button>
              </>
            )}

            {/* Share / copy the verdict card — Web Share API where
                available, clipboard fallback otherwise. */}
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleShareResult}
                className="rounded-full bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white sm:text-sm dark:bg-white dark:text-zinc-900"
              >
                {shareFeedback === 'shared'
                  ? `✅ ${t.resultShared}`
                  : shareFeedback === 'copied'
                    ? `✅ ${t.resultCopied}`
                    : `📤 ${t.shareResult}`}
              </button>
              <button
                type="button"
                onClick={handleCopyResult}
                className="rounded-full border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold dark:border-zinc-700 dark:bg-zinc-900"
              >
                {shareFeedback === 'copied'
                  ? `✅ ${t.resultCopied}`
                  : `📋 ${t.copyResult}`}
              </button>
            </div>
          </section>
        )}

        {/* History — list scrolls internally so long histories don't
            stretch the page. */}
        <section className="mb-4 rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm sm:mb-6 sm:p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold sm:text-base">🕘 {t.historyTitle}</h2>
            {history.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  clearHistory()
                  setHistory([])
                }}
                className="rounded-full border border-zinc-300 px-3 py-1 text-xs font-semibold dark:border-zinc-700"
              >
                {t.clearHistory}
              </button>
            )}
          </div>
          {history.length === 0 ? (
            <p className="mt-2 text-sm text-zinc-500">{t.emptyHistory}</p>
          ) : (
            <ul className="mt-2 max-h-64 divide-y divide-zinc-200 overflow-y-auto dark:divide-zinc-800">
              {history.map((entry) => (
                <li key={entry.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setMessage(entry.message)
                      setResult(null)
                      setErrorKind(null)
                    }}
                    className="flex w-full items-center gap-2 py-2 text-left text-sm"
                  >
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold text-white ${
                        entry.verdict === 'scam'
                          ? 'bg-red-600'
                          : entry.verdict === 'suspicious'
                            ? 'bg-amber-500'
                            : 'bg-emerald-600'
                      }`}
                    >
                      {entry.score}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-zinc-700 dark:text-zinc-300">
                      {entry.preview}
                    </span>
                    <span className="shrink-0 text-xs text-zinc-400">
                      {entry.inferenceSource === 'on_device'
                        ? '📱'
                        : entry.inferenceSource === 'in_cloud'
                          ? '☁️'
                          : '❓'}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <footer className="text-center text-xs text-zinc-500 dark:text-zinc-500">
          <p>{t.footerPrivacy}</p>
          <p className="mt-1">{t.privacyNote}</p>
        </footer>
      </main>
    </div>
  )
}
