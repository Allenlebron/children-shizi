import { markCompleted, readProgress, toggleFavorite } from './store'

beforeEach(() => {
  localStorage.clear()
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

it('marks a card as completed in local storage', () => {
  vi.setSystemTime(new Date('2026-04-23T08:00:00.000Z'))

  markCompleted({ cardId: 'bei', character: '北', source: 'curated' })

  expect(localStorage.length).toBe(1)
  expect(readProgress().bei).toEqual({
    cardId: 'bei',
    character: '北',
    source: 'curated',
    completed: true,
    favorite: false,
    lastOpenedAt: '2026-04-23T08:00:00.000Z',
  })
})

it('toggles favorite while preserving completion and refreshing last opened time', () => {
  vi.setSystemTime(new Date('2026-04-23T08:00:00.000Z'))
  markCompleted({ cardId: 'bei', character: '北', source: 'curated' })

  vi.setSystemTime(new Date('2026-04-23T09:00:00.000Z'))
  toggleFavorite({ cardId: 'bei', character: '北', source: 'curated' })

  expect(readProgress().bei.completed).toBe(true)
  expect(readProgress().bei.favorite).toBe(true)
  expect(readProgress().bei.lastOpenedAt).toBe('2026-04-23T09:00:00.000Z')
})

it('normalizes malformed stored progress entries into a safe shape', () => {
  localStorage.setItem(
    'hanzi-h5-progress',
    JSON.stringify({
      bei: {
        completed: 'yes',
        favorite: true,
        lastOpenedAt: 123,
      },
      nan: 'broken',
    }),
  )

  expect(readProgress()).toEqual({
    bei: {
      cardId: 'bei',
      character: '',
      source: 'curated',
      completed: false,
      favorite: true,
      lastOpenedAt: null,
    },
    nan: {
      cardId: 'nan',
      character: '',
      source: 'curated',
      completed: false,
      favorite: false,
      lastOpenedAt: null,
    },
  })
})
