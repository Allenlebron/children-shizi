export type ResolveSearchResponse =
  | { status: 'unsupported'; query: string }
  | { status: 'needs_generation'; query: string }
  | { status: 'ready_private'; query: string; cardId: string }
  | { status: 'ready_public'; query: string; cardId: string }

export type GenerateCardResponse =
  | { status: 'ready_private'; query: string; cardId: string; attempts: number }
  | { status: 'failed'; query: string; reason: 'quality_gate'; attempts: number }

export type FetchCardDocumentResponse = {
  cardId: string
  access: 'ready_private' | 'ready_public'
  card: {
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
}
