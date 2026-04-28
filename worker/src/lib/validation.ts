export interface HanziCardPayload {
  slug: string
  character: string
  pinyin: string
  theme: string
  estimatedMinutes: number
  heroLine: string
  storyScene: string
  storyText: string
  parentPrompt: string
  words: string[]
  sentences: string[]
  activityPrompt: string
}

export function validateGeneratedCard(card: HanziCardPayload, query: string) {
  const issues: string[] = []

  if (card.character !== query) {
    issues.push('character mismatch')
  }
  if (card.estimatedMinutes !== 5) {
    issues.push('estimatedMinutes must be 5')
  }
  if (card.words.length !== 3) {
    issues.push('must return exactly 3 words')
  }
  if (card.sentences.length !== 2) {
    issues.push('must return exactly 2 sentences')
  }
  if (!card.words.some((word) => word.includes(query))) {
    issues.push('words must include the character')
  }
  if (!card.sentences.some((sentence) => sentence.includes(query))) {
    issues.push('sentences must include the character')
  }
  if (/甲骨文|部首|象形字/.test(card.parentPrompt)) {
    issues.push('parentPrompt sounds like a lecture')
  }
  if (card.activityPrompt.length < 6) {
    issues.push('activityPrompt too short')
  }

  return issues
}
