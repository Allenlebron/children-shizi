import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, vi } from 'vitest'
import App from '../../app/App'

afterEach(() => {
  vi.restoreAllMocks()
  window.sessionStorage.clear()
})

it('lets an operator paste a token, inspect private cards, and promote one', async () => {
  const user = userEvent.setup()

  vi.spyOn(globalThis, 'fetch')
    .mockResolvedValueOnce(
      new Response(
        JSON.stringify([
          {
            cardId: 'priv-mu-001',
            character: '木',
            browserId: 'browser-alpha',
            createdAt: '2026-04-25T09:00:00.000Z',
          },
        ]),
        {
          status: 200,
          headers: { 'content-type': 'application/json' },
        },
      ),
    )
    .mockResolvedValueOnce(
      new Response(
        JSON.stringify({ status: 'ready_public', cardId: 'priv-mu-001', character: '木' }),
        {
          status: 200,
          headers: { 'content-type': 'application/json' },
        },
      ),
    )

  render(
    <MemoryRouter initialEntries={['/admin']}>
      <App />
    </MemoryRouter>,
  )

  await user.type(screen.getByLabelText(/管理员 token/i), 'test-admin-token')
  await user.click(screen.getByRole('button', { name: /加载生成记录/i }))
  await user.click(await screen.findByRole('button', { name: /提升为公共缓存/i }))

  expect(await screen.findByRole('status')).toHaveTextContent('已提升 木')
})
