import { describe, expect, it } from 'vitest'
import { getCardBySlug, getDailyCard, listCards } from './index'

describe('card registry', () => {
  it('returns the seeded 北 card by slug', () => {
    expect(getCardBySlug('bei')?.character).toBe('北')
  })

  it('exposes at least one curated card for the daily entry point', () => {
    expect(getDailyCard()).toBeDefined()
    expect(listCards()).toHaveLength(1)
  })
})
