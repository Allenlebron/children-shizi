export function createJobId(query: string) {
  return `job-${query}-${crypto.randomUUID()}`
}

export function createPrivateCardId(query: string) {
  return `priv-${query}-${crypto.randomUUID()}`
}
