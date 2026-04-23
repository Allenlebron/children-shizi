import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useLocation } from 'react-router-dom'
import App from '../../app/App'

function LocationProbe() {
  const { pathname } = useLocation()

  return <div data-testid="location">{pathname}</div>
}

function renderApp(path: string = '/') {
  render(
    <MemoryRouter initialEntries={[path]}>
      <LocationProbe />
      <App />
    </MemoryRouter>,
  )
}

it('navigates the daily card CTA to /cards/bei', async () => {
  const user = userEvent.setup()

  renderApp('/')

  await user.click(screen.getByRole('button', { name: /开始今天这张卡/i }))

  expect(screen.getByTestId('location')).toHaveTextContent('/cards/bei')
  expect(screen.getByRole('heading', { name: /学习页/i })).toBeInTheDocument()
})

it('navigates the search flow for 北 to /cards/bei', async () => {
  const user = userEvent.setup()

  renderApp('/')

  await user.type(screen.getByLabelText(/搜一个字/i), '北')
  await user.click(screen.getByRole('button', { name: /打开这个字卡/i }))

  expect(screen.getByTestId('location')).toHaveTextContent('/cards/bei')
  expect(screen.getByRole('heading', { name: /学习页/i })).toBeInTheDocument()
})

it('disables blank search and clears the miss message on input change', async () => {
  const user = userEvent.setup()

  renderApp('/')

  const input = screen.getByLabelText(/搜一个字/i)
  const button = screen.getByRole('button', { name: /打开这个字卡/i })

  expect(button).toBeDisabled()

  await user.type(input, '南')
  await user.click(button)

  expect(screen.getByRole('status')).toHaveTextContent('没找到这个字卡')

  await user.clear(input)

  expect(button).toBeDisabled()
  expect(screen.queryByRole('status')).not.toBeInTheDocument()
})
