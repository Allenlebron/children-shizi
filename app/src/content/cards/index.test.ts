import { describe, expect, it } from 'vitest'
import { findCardByQuery, getCardBySlug, getDailyCard, listCards } from './index'

describe('card registry', () => {
  it('exposes at least one curated card for the daily entry point', () => {
    expect(getDailyCard()).toBeDefined()
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

  it.each([
    {
      accessor: 'listCards',
      read: () => listCards()[0],
      reRead: () => getCardBySlug('bei'),
    },
    {
      accessor: 'getDailyCard',
      read: () => getDailyCard(),
      reRead: () => getDailyCard(),
    },
    {
      accessor: 'getCardBySlug',
      read: () => getCardBySlug('bei'),
      reRead: () => getCardBySlug('bei'),
    },
    {
      accessor: 'findCardByQuery',
      read: () => findCardByQuery('bei'),
      reRead: () => findCardByQuery('bei'),
    },
  ])('keeps $accessor isolated from registry mutations', ({ read, reRead }) => {
    const card = read()

    expect(card).toBeDefined()
    if (!card) {
      return
    }

    card.character = '南'
    card.words.push('南边')
    card.sentences.push('南风吹来了。')

    expect(reRead()).toMatchObject({
      slug: 'bei',
      character: '北',
      words: ['北边', '北风', '北极熊'],
      sentences: ['北风吹来了。', '北极熊住在北边很冷的地方。'],
    })
  })
})
