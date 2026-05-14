export interface HanziComicScene {
  imageSrc: string
  alt: string
  caption: string
  questions: string[]
}

export interface HanziCard {
  slug: string
  character: string
  pinyin: string
  theme: string
  estimatedMinutes: number
  heroLine: string
  storyScene: string
  comic?: HanziComicScene
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
