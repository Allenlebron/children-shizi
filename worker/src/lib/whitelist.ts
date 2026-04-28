const HANZI_PATTERN = /^[\u4e00-\u9fff]$/

export function normalizeQuery(query: unknown) {
  if (typeof query !== 'string') {
    return ''
  }

  return query.trim()
}

export function isSingleHanzi(query: string) {
  return HANZI_PATTERN.test(query)
}
