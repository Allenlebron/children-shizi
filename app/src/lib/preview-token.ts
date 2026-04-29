const PREVIEW_TOKEN_KEY = 'hanzi-preview-token'

export function rememberPreviewToken(token: string) {
  const trimmed = token.trim()

  if (trimmed) {
    window.localStorage.setItem(PREVIEW_TOKEN_KEY, trimmed)
  }
}

export function getPreviewToken() {
  return window.localStorage.getItem(PREVIEW_TOKEN_KEY)
}
