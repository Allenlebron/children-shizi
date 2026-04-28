import type { ProgressSnapshot } from '../../content/types'

const PROGRESS_STORAGE_KEY = 'hanzi-h5-progress'

export type CardProgress = {
  cardId: string
  character: string
  source: ProgressSnapshot['source']
  completed: boolean
  favorite: boolean
  lastOpenedAt: string | null
}

export type ProgressMap = Record<string, CardProgress>

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
