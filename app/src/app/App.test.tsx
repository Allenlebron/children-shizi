import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from './App'

it('shows the daily-card start CTA', () => {
  render(
    <MemoryRouter initialEntries={['/']}>
      <App />
    </MemoryRouter>,
  )

  expect(
    screen.getByRole('button', { name: /开始今天这张卡/i }),
  ).toBeInTheDocument()
})
