const STORAGE_KEY = 'hanzi-h5-browser-id'

export function getBrowserId() {
  try {
    const existing = window.localStorage.getItem(STORAGE_KEY)
    if (existing) {
      return existing
    }
  } catch {
    // Keep search usable when browser storage is unavailable.
  }

  const next =
    typeof globalThis.crypto?.randomUUID === 'function'
      ? globalThis.crypto.randomUUID()
      : `browser-${Date.now()}`

  try {
    window.localStorage.setItem(STORAGE_KEY, next)
  } catch {
    // The generated id still works for this request even if it cannot be persisted.
  }

  return next
}
