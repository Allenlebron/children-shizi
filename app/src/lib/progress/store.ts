import type { ProgressSnapshot } from '../../content/types'

const PROGRESS_STORAGE_KEY = 'hanzi-h5-progress'
const REVIEW_STORAGE_KEY = 'hanzi-h5-review'

export type CardProgress = {
  cardId: string
  character: string
  source: ProgressSnapshot['source']
  completed: boolean
  favorite: boolean
  lastOpenedAt: string | null
}

export type ProgressMap = Record<string, CardProgress>

export type ReviewAttempt = {
  completedAt: string
  dateKey: string
  totalQuestions: number
  correctAnswers: number
  leaves: number
}

export type ReviewSummary = {
  todayKey: string
  todayAttempts: number
  todayLeaves: number
  totalAttempts: number
  totalLeaves: number
  lastCompletedAt: string | null
}

function createEmptyProgress(snapshot: ProgressSnapshot): CardProgress {
  return {
    ...snapshot,
    completed: false,
    favorite: false,
    lastOpenedAt: null,
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function normalizeSource(source: unknown): ProgressSnapshot['source'] {
  if (source === 'ready_private' || source === 'ready_public' || source === 'curated') {
    return source
  }

  return 'curated'
}

function normalizeProgressEntry(cardId: string, entry: unknown): CardProgress {
  if (!isRecord(entry)) {
    return createEmptyProgress({
      cardId,
      character: '',
      source: 'curated',
    })
  }

  return {
    cardId,
    character: typeof entry.character === 'string' ? entry.character : '',
    source: normalizeSource(entry.source),
    completed: entry.completed === true,
    favorite: entry.favorite === true,
    lastOpenedAt: typeof entry.lastOpenedAt === 'string' ? entry.lastOpenedAt : null,
  }
}

function readStoredProgress(): ProgressMap {
  const raw = window.localStorage.getItem(PROGRESS_STORAGE_KEY)

  if (!raw) {
    return {}
  }

  try {
    const parsed = JSON.parse(raw)
    if (!isRecord(parsed)) {
      return {}
    }

    return Object.fromEntries(
      Object.entries(parsed).map(([cardId, entry]) => [cardId, normalizeProgressEntry(cardId, entry)]),
    )
  } catch {
    return {}
  }
}

function writeProgress(progress: ProgressMap) {
  window.localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress))
}

function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function normalizeNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

function normalizeReviewAttempt(entry: unknown): ReviewAttempt | null {
  if (!isRecord(entry)) {
    return null
  }

  const completedAt = typeof entry.completedAt === 'string' ? entry.completedAt : ''
  const dateKey = typeof entry.dateKey === 'string' ? entry.dateKey : completedAt.slice(0, 10)

  if (!completedAt || !dateKey) {
    return null
  }

  return {
    completedAt,
    dateKey,
    totalQuestions: normalizeNumber(entry.totalQuestions),
    correctAnswers: normalizeNumber(entry.correctAnswers),
    leaves: normalizeNumber(entry.leaves),
  }
}

function readReviewAttempts(): ReviewAttempt[] {
  const raw = window.localStorage.getItem(REVIEW_STORAGE_KEY)

  if (!raw) {
    return []
  }

  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed.flatMap((entry) => {
      const normalized = normalizeReviewAttempt(entry)
      return normalized ? [normalized] : []
    })
  } catch {
    return []
  }
}

function writeReviewAttempts(attempts: ReviewAttempt[]) {
  window.localStorage.setItem(REVIEW_STORAGE_KEY, JSON.stringify(attempts))
}

function updateProgress(snapshot: ProgressSnapshot, updater: (entry: CardProgress) => CardProgress) {
  const progress = readStoredProgress()
  const nextEntry = updater(progress[snapshot.cardId] ?? createEmptyProgress(snapshot))

  writeProgress({
    ...progress,
    [snapshot.cardId]: nextEntry,
  })
}

export function readProgress() {
  return readStoredProgress()
}

export function markCompleted(snapshot: ProgressSnapshot) {
  updateProgress(snapshot, (entry) => ({
    ...entry,
    completed: true,
    lastOpenedAt: new Date().toISOString(),
  }))
}

export function toggleFavorite(snapshot: ProgressSnapshot) {
  updateProgress(snapshot, (entry) => ({
    ...entry,
    favorite: !entry.favorite,
    lastOpenedAt: new Date().toISOString(),
  }))
}

export function recordReviewResult(result: Omit<ReviewAttempt, 'completedAt' | 'dateKey'>) {
  const now = new Date()
  const attempts = readReviewAttempts()

  writeReviewAttempts([
    ...attempts,
    {
      ...result,
      completedAt: now.toISOString(),
      dateKey: getLocalDateKey(now),
    },
  ])
}

export function readReviewSummary(): ReviewSummary {
  const todayKey = getLocalDateKey()
  const attempts = readReviewAttempts()
  const todayAttempts = attempts.filter((attempt) => attempt.dateKey === todayKey)

  return {
    todayKey,
    todayAttempts: todayAttempts.length,
    todayLeaves: todayAttempts.reduce((sum, attempt) => sum + attempt.leaves, 0),
    totalAttempts: attempts.length,
    totalLeaves: attempts.reduce((sum, attempt) => sum + attempt.leaves, 0),
    lastCompletedAt: attempts.at(-1)?.completedAt ?? null,
  }
}
