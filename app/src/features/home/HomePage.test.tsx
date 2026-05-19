import { render, screen, waitFor } from '@testing-library/react'
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
  expect(screen.getByText('1 / 6 · 看画面')).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: /北/i })).toBeInTheDocument()
})

it('navigates the search flow for 北 to /cards/bei', async () => {
  const user = userEvent.setup()

  renderApp('/')

  await user.type(screen.getByLabelText(/搜一个字/i), '北')
  await user.click(screen.getByRole('button', { name: /打开这个字卡/i }))

  expect(screen.getByTestId('location')).toHaveTextContent('/cards/bei')
  expect(screen.getByText('1 / 6 · 看画面')).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: /北/i })).toBeInTheDocument()
})

it('opens an MVP cached card without calling the generated search API', async () => {
  const user = userEvent.setup()
  const fetchMock = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network should stay idle'))

  renderApp('/')

  await user.type(screen.getByLabelText(/搜一个字/i), '水')
  await user.click(screen.getByRole('button', { name: /打开这个字卡/i }))

  expect(screen.getByTestId('location')).toHaveTextContent('/cards/shui')
  expect(screen.getByText('1 / 6 · 看画面')).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: /水/i })).toBeInTheDocument()
  expect(fetchMock).not.toHaveBeenCalled()
})

it('opens the leaf review quest from the home page', async () => {
  const user = userEvent.setup()

  renderApp('/')

  expect(screen.getByText('今天已收集 0 片')).toBeInTheDocument()

  await user.click(screen.getByRole('button', { name: /开始复习小闯关/i }))

  expect(screen.getByTestId('location')).toHaveTextContent('/review')
  expect(screen.getByRole('heading', { name: '小树叶闯关' })).toBeInTheDocument()
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
    new Response(JSON.stringify({ status: 'unsupported', query: '南' }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    }),
  )

  renderApp('/')

  await user.type(screen.getByLabelText(/搜一个字/i), '南')
  await user.click(screen.getByRole('button', { name: /打开这个字卡/i }))

  expect(await screen.findByRole('status')).toHaveTextContent('首版暂不支持这个字')
})

it('generates a private card and navigates to the returned card id', async () => {
  const user = userEvent.setup()

  vi.spyOn(globalThis, 'fetch')
    .mockResolvedValueOnce(
      new Response(JSON.stringify({ status: 'needs_generation', query: '马' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    )
    .mockResolvedValueOnce(
      new Response(JSON.stringify({ status: 'ready_private', query: '马', cardId: 'priv-ma-001' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    )

  renderApp('/')

  await user.type(screen.getByLabelText(/搜一个字/i), '马')
  await user.click(screen.getByRole('button', { name: /打开这个字卡/i }))

  await waitFor(() => {
    expect(screen.getByTestId('location')).toHaveTextContent('/cards/priv-ma-001')
  })
})

it('sends the preview token when generating a card from a preview URL', async () => {
  const user = userEvent.setup()
  const fetchMock = vi
    .spyOn(globalThis, 'fetch')
    .mockResolvedValueOnce(
      new Response(JSON.stringify({ status: 'needs_generation', query: '马' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    )
    .mockResolvedValueOnce(
      new Response(JSON.stringify({ status: 'ready_private', query: '马', cardId: 'priv-ma-001' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    )

  renderApp('/?previewToken=family-preview')

  await user.type(screen.getByLabelText(/搜一个字/i), '马')
  await user.click(screen.getByRole('button', { name: /打开这个字卡/i }))

  await waitFor(() => {
    expect(screen.getByTestId('location')).toHaveTextContent('/cards/priv-ma-001')
  })
  expect(fetchMock.mock.calls[1]?.[1]).toMatchObject({
    headers: expect.objectContaining({
      'x-preview-token': 'family-preview',
    }),
  })
})

it('uses the preview token from the current URL even before storage has settled', async () => {
  const user = userEvent.setup()
  const fetchMock = vi
    .spyOn(globalThis, 'fetch')
    .mockResolvedValueOnce(
      new Response(JSON.stringify({ status: 'needs_generation', query: '马' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    )
    .mockResolvedValueOnce(
      new Response(JSON.stringify({ status: 'ready_private', query: '马', cardId: 'priv-ma-001' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    )
  const setItem = vi.spyOn(window.localStorage.__proto__, 'setItem')
  setItem.mockImplementation(() => {
    throw new Error('storage is delayed')
  })

  window.history.pushState({}, '', '/?previewToken=url-token')
  renderApp('/?previewToken=url-token')

  await user.type(screen.getByLabelText(/搜一个字/i), '马')
  await user.click(screen.getByRole('button', { name: /打开这个字卡/i }))

  await waitFor(() => {
    expect(screen.getByTestId('location')).toHaveTextContent('/cards/priv-ma-001')
  })
  expect(fetchMock.mock.calls[1]?.[1]).toMatchObject({
    headers: expect.objectContaining({
      'x-preview-token': 'url-token',
    }),
  })
})
