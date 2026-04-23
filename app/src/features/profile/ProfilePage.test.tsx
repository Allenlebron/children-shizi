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
  markCompleted('bei')
  toggleFavorite('bei')

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
