import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from '../../app/App'
import { markCompleted, toggleFavorite } from '../../lib/progress/store'

function renderApp(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  localStorage.clear()
})

it('shows local learning progress on the profile page', () => {
  markCompleted({ cardId: 'bei', character: '北', source: 'curated' })
  toggleFavorite({ cardId: 'bei', character: '北', source: 'curated' })

  renderApp('/me')

  expect(screen.getByText('学过 1 张')).toBeInTheDocument()
  expect(screen.getByText('收藏 1 张')).toBeInTheDocument()
  expect(screen.getByRole('img', { name: '识字小树，已长出 2 片叶子' })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: '北' })).toHaveAttribute('href', '/cards/bei')
})

it('does not list cards that were only opened without being completed or favorited', () => {
  localStorage.setItem(
    'hanzi-h5-progress',
    JSON.stringify({
      bei: {
        cardId: 'bei',
        character: '北',
        source: 'curated',
        completed: false,
        favorite: false,
        lastOpenedAt: '2026-04-23T08:00:00.000Z',
      },
    }),
  )

  renderApp('/me')

  expect(screen.getByText('学过 0 张')).toBeInTheDocument()
  expect(screen.getByText('收藏 0 张')).toBeInTheDocument()
  expect(screen.getByRole('img', { name: '识字小树，已长出 0 片叶子' })).toBeInTheDocument()
  expect(screen.queryByText('北')).not.toBeInTheDocument()
})

it('shows generated-card snapshots from progress storage', () => {
  localStorage.setItem(
    'hanzi-h5-progress',
    JSON.stringify({
      'priv-mu-001': {
        cardId: 'priv-mu-001',
        character: '木',
        source: 'ready_private',
        completed: true,
        favorite: true,
        lastOpenedAt: '2026-04-25T09:00:00.000Z',
      },
    }),
  )

  renderApp('/me')

  expect(screen.getByText('学过 1 张')).toBeInTheDocument()
  expect(screen.getByText('收藏 1 张')).toBeInTheDocument()
  expect(screen.getByRole('img', { name: '识字小树，已长出 2 片叶子' })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: '木' })).toHaveAttribute('href', '/cards/priv-mu-001')
})

it('recovers the Hanzi for older curated progress entries that missed the character snapshot', () => {
  localStorage.setItem(
    'hanzi-h5-progress',
    JSON.stringify({
      bei: {
        cardId: 'bei',
        character: '',
        source: 'curated',
        completed: true,
        favorite: false,
        lastOpenedAt: '2026-04-25T09:00:00.000Z',
      },
    }),
  )

  renderApp('/me')

  expect(screen.getByRole('img', { name: '识字小树，已长出 1 片叶子' })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: '北' })).toHaveAttribute('href', '/cards/bei')
})

it('summarizes extra leaves when the tree has more progress than fits comfortably', () => {
  localStorage.setItem(
    'hanzi-h5-progress',
    JSON.stringify(
      Object.fromEntries(
        ['北', '火', '山', '水', '木', '天', '日', '月', '手'].map((character, index) => [
          `card-${index}`,
          {
            cardId: `card-${index}`,
            character,
            source: 'curated',
            completed: true,
            favorite: false,
            lastOpenedAt: `2026-04-${String(index + 1).padStart(2, '0')}T09:00:00.000Z`,
          },
        ]),
      ),
    ),
  )

  const { container } = renderApp('/me')

  expect(screen.getByRole('img', { name: '识字小树，已长出 9 片叶子' })).toBeInTheDocument()
  expect(container.querySelectorAll('.profile-tree-leaf')).toHaveLength(6)
  expect(screen.getByText('还有 3 片小叶子在森林里。')).toBeInTheDocument()
})
