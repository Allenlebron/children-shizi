import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from './App'

it('renders bottom navigation and lands on the home page', () => {
  render(
    <MemoryRouter initialEntries={['/']}>
      <App />
    </MemoryRouter>,
  )

  expect(screen.getByRole('link', { name: /首页/i })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: /字卡/i })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: /我的/i })).toBeInTheDocument()
  expect(screen.getByText(/今天的故事字/i)).toBeInTheDocument()
})
