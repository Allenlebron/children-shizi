import { beiCard } from './bei'

const cards = [beiCard]

export function listCards() {
  return [...cards]
}

export function getDailyCard() {
  return cards[0]
}

export function getCardBySlug(slug: string) {
  return cards.find((card) => card.slug === slug)
}

export function findCardByQuery(query: string) {
  const normalized = query.trim().toLowerCase()
  return cards.find(
    (card) =>
      card.slug === normalized ||
      card.character === query.trim() ||
      card.pinyin.toLowerCase() === normalized,
  )
}
