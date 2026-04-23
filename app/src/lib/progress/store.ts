const PROGRESS_STORAGE_KEY = 'hanzi-h5-progress'

export type CardProgress = {
  completed: boolean
  favorite: boolean
  lastOpenedAt: string | null
}

export type ProgressMap = Record<string, CardProgress>

function createEmptyProgress(): CardProgress {
  return {
    completed: false,
    favorite: false,
    lastOpenedAt: null,
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function normalizeProgressEntry(entry: unknown): CardProgress {
  if (!isRecord(entry)) {
    return createEmptyProgress()
  }

  return {
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
      Object.entries(parsed).map(([slug, entry]) => [slug, normalizeProgressEntry(entry)]),
    )
  } catch {
    return {}
  }
}

function writeProgress(progress: ProgressMap) {
  window.localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress))
}

function updateProgress(
  slug: string,
  updater: (entry: CardProgress) => CardProgress,
) {
  const progress = readStoredProgress()
  const nextEntry = updater(
    progress[slug] ?? createEmptyProgress(),
  )

  writeProgress({
    ...progress,
    [slug]: nextEntry,
  })
}

export function readProgress() {
  return readStoredProgress()
}

export function markCompleted(slug: string) {
  updateProgress(slug, (entry) => ({
    ...entry,
    completed: true,
    lastOpenedAt: new Date().toISOString(),
  }))
}

export function toggleFavorite(slug: string) {
  updateProgress(slug, (entry) => ({
    ...entry,
    favorite: !entry.favorite,
    lastOpenedAt: new Date().toISOString(),
  }))
}
