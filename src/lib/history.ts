/**
 * Local history — past analyses stored in localStorage only.
 * Nothing is ever sent to a server: history lives on the user's device.
 */
import type { InferenceSourceLabel } from './hybrid'
import type { Verdict } from './verdict'

export interface HistoryEntry {
  id: string
  /** Full analyzed message (stored on-device only, in localStorage). */
  message: string
  /** First ~120 chars of the analyzed message (preview only). */
  preview: string
  verdict: Verdict['verdict']
  score: number
  inferenceSource: InferenceSourceLabel
  privacyMode: boolean
  language: 'id' | 'en'
  createdAt: number
}

const STORAGE_KEY = 'cektipu:history:v1'
const MAX_ENTRIES = 50

export function loadHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (e): e is HistoryEntry =>
        typeof e === 'object' &&
        e !== null &&
        typeof (e as Record<string, unknown>).id === 'string',
    )
  } catch {
    return []
  }
}

export function addHistoryEntry(
  entry: Omit<HistoryEntry, 'id' | 'createdAt'>,
): HistoryEntry[] {
  const full: HistoryEntry = {
    ...entry,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: Date.now(),
  }
  const next = [full, ...loadHistory()].slice(0, MAX_ENTRIES)
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // Storage full / unavailable — history is a nice-to-have, ignore.
  }
  return next
}

export function clearHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Ignore.
  }
}
