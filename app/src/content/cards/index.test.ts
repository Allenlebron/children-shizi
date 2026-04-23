import { describe, expect, it } from 'vitest'
import { findCardByQuery, getCardBySlug, getDailyCard, listCards } from './index'

describe('card registry', () => {
  it('returns the seeded 北 card by slug', () => {
    expect(getCardBySlug('bei')?.character).toBe('北')
  })

  it('exposes at least one curated card for the daily entry point', () => {
    expect(getDailyCard()).toBeDefined()
    expect(listCards()).toHaveLength(1)
  })

  it('keeps the registry isolated when the returned list is mutated', () => {
    const cards = listCards() as unknown as Array<unknown>
    cards.push('mutated')

    expect(listCards()).toHaveLength(1)
  })

  it('finds the seeded card by a normalized slug query', () => {
    expect(findCardByQuery('  BEI  ')?.slug).toBe('bei')
  })

  it('finds the seeded card by character query', () => {
    expect(findCardByQuery('北')?.slug).toBe('bei')
  })

  it('finds the seeded card by pinyin query', () => {
    expect(findCardByQuery('bei')?.character).toBe('北')
  })

  it('returns undefined for an unknown query', () => {
    expect(findCardByQuery('south')).toBeUndefined()
  })
})
