export interface HanziCard {
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

export interface CardDocument {
  cardId: string
  access: 'curated' | 'ready_private' | 'ready_public'
  card: HanziCard
}

export interface ProgressSnapshot {
  cardId: string
  character: string
  source: CardDocument['access']
}
