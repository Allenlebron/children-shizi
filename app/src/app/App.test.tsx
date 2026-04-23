import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from './App'

function renderApp(path: string) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )
}

it('renders the home page and bottom nav at /', () => {
  renderApp('/')

  expect(screen.getByRole('link', { name: /首页/i })).toHaveAttribute('aria-current', 'page')
  expect(screen.getByRole('link', { name: /字卡/i })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: /我的/i })).toBeInTheDocument()
  expect(screen.getByText(/今天的故事字/i)).toBeInTheDocument()
})

it('renders the library placeholder through the shell at /cards', () => {
  renderApp('/cards')

  expect(screen.getByRole('heading', { name: /精选字卡/i })).toBeInTheDocument()
  expect(screen.getByRole('navigation', { name: /主导航/i })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: /字卡/i })).toHaveAttribute('aria-current', 'page')
  expect(screen.getByRole('link', { name: /北 · 方向/i })).toHaveAttribute('href', '/cards/bei')
})

it('renders the card placeholder through the shell at /cards/bei', () => {
  renderApp('/cards/bei')

  expect(screen.getByRole('heading', { name: /学习页/i })).toBeInTheDocument()
  expect(screen.getByRole('navigation', { name: /主导航/i })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: /字卡/i })).toHaveAttribute('aria-current', 'page')
})

it('renders the profile placeholder through the shell at /me', () => {
  renderApp('/me')

  expect(screen.getByRole('heading', { name: /我的/i })).toBeInTheDocument()
  expect(screen.getByRole('navigation', { name: /主导航/i })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: /我的/i })).toHaveAttribute('aria-current', 'page')
})

it('redirects unknown paths to / and shows the home page', () => {
  renderApp('/missing')

  expect(screen.getByRole('link', { name: /首页/i })).toHaveAttribute('aria-current', 'page')
  expect(screen.getByText(/今天的故事字/i)).toBeInTheDocument()
})
