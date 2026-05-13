import type { HanziCard } from '../types'
import { mvpCachedCards } from './mvp-cache'

const cards = mvpCachedCards

function cloneCard(card: HanziCard) {
  return {
    ...card,
    words: [...card.words],
    sentences: [...card.sentences],
  }
}

export function listCards() {
  return cards.map(cloneCard)
}

export function getDailyCard() {
  return cards[0] ? cloneCard(cards[0]) : undefined
}

export function getCardBySlug(slug: string) {
  const card = cards.find((card) => card.slug === slug)
  return card ? cloneCard(card) : undefined
}

export function findCardByQuery(query: string) {
  const normalized = query.trim().toLowerCase()
  const card = cards.find(
    (card) =>
      card.slug === normalized ||
      card.character === query.trim() ||
      card.pinyin.toLowerCase() === normalized,
  )
  return card ? cloneCard(card) : undefined
}
