import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { afterEach, vi } from 'vitest'
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

afterEach(() => {
  vi.restoreAllMocks()
  window.localStorage.clear()
})

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
  vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
    new Response(JSON.stringify({ status: 'unsupported', query: '南' }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    }),
  )

  renderApp('/')

  const input = screen.getByLabelText(/搜一个字/i)
  const button = screen.getByRole('button', { name: /打开这个字卡/i })

  expect(button).toBeDisabled()

  await user.type(input, '南')
  await user.click(button)

  expect(await screen.findByRole('status')).toHaveTextContent('首版暂不支持这个字')

  await user.clear(input)

  expect(button).toBeDisabled()
  expect(screen.queryByRole('status')).not.toBeInTheDocument()
})

it('shows an unsupported message when the API rejects the searched Hanzi', async () => {
  const user = userEvent.setup()

  vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
    new Response(JSON.stringify({ status: 'unsupported', query: '火' }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    }),
  )

  renderApp('/')

  await user.type(screen.getByLabelText(/搜一个字/i), '火')
  await user.click(screen.getByRole('button', { name: /打开这个字卡/i }))

  expect(await screen.findByRole('status')).toHaveTextContent('首版暂不支持这个字')
})

it('generates a private card and navigates to the returned card id', async () => {
  const user = userEvent.setup()

  vi.spyOn(globalThis, 'fetch')
    .mockResolvedValueOnce(
      new Response(JSON.stringify({ status: 'needs_generation', query: '木' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    )
    .mockResolvedValueOnce(
      new Response(JSON.stringify({ status: 'ready_private', query: '木', cardId: 'priv-mu-001' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    )

  renderApp('/')

  await user.type(screen.getByLabelText(/搜一个字/i), '木')
  await user.click(screen.getByRole('button', { name: /打开这个字卡/i }))

  expect(await screen.findByTestId('location')).toHaveTextContent('/cards/priv-mu-001')
})
