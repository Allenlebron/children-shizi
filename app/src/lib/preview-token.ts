const PREVIEW_TOKEN_KEY = 'hanzi-preview-token'

export function rememberPreviewToken(token: string) {
  const trimmed = token.trim()

  if (trimmed) {
    try {
      window.localStorage.setItem(PREVIEW_TOKEN_KEY, trimmed)
    } catch {
      // The current URL token still works when storage is unavailable.
    }
  }
}

export function getPreviewToken() {
  const urlToken = new URLSearchParams(window.location.search).get('previewToken')?.trim()

  if (urlToken) {
    return urlToken
  }

  try {
    return window.localStorage.getItem(PREVIEW_TOKEN_KEY)
  } catch {
    return null
  }
}
