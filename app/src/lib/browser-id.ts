const STORAGE_KEY = 'hanzi-h5-browser-id'

export function getBrowserId() {
  const existing = window.localStorage.getItem(STORAGE_KEY)
  if (existing) {
    return existing
  }

  const next =
    typeof globalThis.crypto?.randomUUID === 'function'
      ? globalThis.crypto.randomUUID()
      : `browser-${Date.now()}`

  window.localStorage.setItem(STORAGE_KEY, next)
  return next
}
