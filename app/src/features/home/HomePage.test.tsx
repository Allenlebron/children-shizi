import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import App from '../../app/App'

it('starts the daily card and allows direct search', async () => {
  const user = userEvent.setup()

  render(
    <MemoryRouter initialEntries={['/']}>
      <App />
    </MemoryRouter>,
  )

  await user.type(screen.getByLabelText(/搜一个字/i), '北')
  await user.click(screen.getByRole('button', { name: /打开这个字卡/i }))

  expect(screen.getByRole('heading', { name: /学习页/i })).toBeInTheDocument()
})
