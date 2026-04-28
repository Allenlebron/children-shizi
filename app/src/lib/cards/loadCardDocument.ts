import { getCardBySlug } from '../../content/cards'
import type { CardDocument } from '../../content/types'
import { fetchCardDocument } from '../api/client'

export async function loadCardDocument(cardId: string): Promise<CardDocument | null> {
  const curated = getCardBySlug(cardId)
  if (curated) {
    return {
      cardId: curated.slug,
      access: 'curated',
      card: curated,
    }
  }

  try {
    return await fetchCardDocument(cardId)
  } catch {
    return null
  }
}
