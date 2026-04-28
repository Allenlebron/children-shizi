import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from '../../app/App'
import { markCompleted, toggleFavorite } from '../../lib/progress/store'

function renderApp(path: string) {
  render(
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
  expect(screen.getByText('北')).toBeInTheDocument()
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
  expect(screen.getByText('木')).toBeInTheDocument()
})
