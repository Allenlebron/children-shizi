import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { getDailyCard } from '../content/cards'
import App from './App'

function LocationProbe() {
  const { pathname } = useLocation()

  return <div data-testid="location">{pathname}</div>
}

function renderApp(path: string) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <LocationProbe />
      <App />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  localStorage.clear()
})

it('lets a parent finish the daily card and then see it on the profile page', async () => {
  const user = userEvent.setup()
  const dailyCard = getDailyCard()

  renderApp('/')

  await user.click(screen.getByRole('button', { name: '开始今天这张卡' }))

  expect(screen.getByTestId('location')).toHaveTextContent(`/cards/${dailyCard?.slug}`)

  await user.click(screen.getByRole('button', { name: '今天这张读完了' }))

  expect(screen.getByTestId('location')).toHaveTextContent('/')

  await user.click(screen.getByRole('link', { name: '我的' }))

  expect(screen.getByTestId('location')).toHaveTextContent('/me')
  expect(screen.getByText('学过 1 张')).toBeInTheDocument()
  expect(screen.getByText(dailyCard?.character ?? '')).toBeInTheDocument()
})
