import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useLocation } from 'react-router-dom'
import App from '../../app/App'
import { getCardBySlug } from '../../content/cards'
import { readProgress } from '../../lib/progress/store'

const originalSpeechSynthesis = Object.getOwnPropertyDescriptor(window, 'speechSynthesis')
const originalSpeechSynthesisUtterance = Object.getOwnPropertyDescriptor(
  window,
  'SpeechSynthesisUtterance',
)

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

function restoreWindowProperty(
  name: 'speechSynthesis' | 'SpeechSynthesisUtterance',
  descriptor?: PropertyDescriptor,
) {
  if (descriptor) {
    Object.defineProperty(window, name, descriptor)
    return
  }

  Reflect.deleteProperty(window, name)
}

afterEach(() => {
  localStorage.clear()
  vi.restoreAllMocks()
  restoreWindowProperty('speechSynthesis', originalSpeechSynthesis)
  restoreWindowProperty('SpeechSynthesisUtterance', originalSpeechSynthesisUtterance)
})

it('renders the paged card flow and speaks the story aloud from the story page', async () => {
  const user = userEvent.setup()
  const speak = vi.fn()
  const card = getCardBySlug('bei')

  class MockSpeechSynthesisUtterance {
    text: string

    constructor(text: string) {
      this.text = text
    }
  }

  Object.defineProperty(window, 'speechSynthesis', {
    configurable: true,
    value: {
      cancel: vi.fn(),
      speak,
    },
  })
  Object.defineProperty(window, 'SpeechSynthesisUtterance', {
    configurable: true,
    value: MockSpeechSynthesisUtterance,
  })

  renderApp('/cards/bei')

  expect(screen.getByText('第 1 / 6 页')).toBeInTheDocument()
  expect(screen.getByText('故事画面')).toBeInTheDocument()
  expect(screen.getByText('一个小朋友转过身，背朝前面站着。')).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: '北' })).toBeInTheDocument()
  expect(screen.getByText('今天用一个小故事认识“北”。')).toBeInTheDocument()

  await user.click(screen.getByRole('button', { name: '开始读这张卡' }))
  await user.click(screen.getByRole('button', { name: '听这个故事' }))

  expect(speak).toHaveBeenCalledTimes(1)
  expect(speak.mock.calls[0]?.[0]).toMatchObject({ text: card?.storyText })
})

it('saves progress when the family favorites and completes a card from the finish page', async () => {
  const user = userEvent.setup()

  renderApp('/cards/bei')

  await user.click(screen.getByRole('button', { name: '开始读这张卡' }))
  await user.click(screen.getByRole('button', { name: '下一页' }))
  await user.click(screen.getByRole('button', { name: '下一页' }))
  await user.click(screen.getByRole('button', { name: '下一页' }))
  await user.click(screen.getByRole('button', { name: '下一页' }))
  await user.click(screen.getByRole('button', { name: '收藏这张卡' }))
  await user.click(screen.getByRole('button', { name: '今天这张读完了' }))

  expect(readProgress().bei.completed).toBe(true)
  expect(readProgress().bei.favorite).toBe(true)
  expect(readProgress().bei).toMatchObject({
    cardId: 'bei',
    character: '北',
    source: 'curated',
  })
})

it('shows honest favorite button copy as the saved favorite state changes on the finish page', async () => {
  const user = userEvent.setup()

  renderApp('/cards/bei')

  await user.click(screen.getByRole('button', { name: '开始读这张卡' }))
  await user.click(screen.getByRole('button', { name: '下一页' }))
  await user.click(screen.getByRole('button', { name: '下一页' }))
  await user.click(screen.getByRole('button', { name: '下一页' }))
  await user.click(screen.getByRole('button', { name: '下一页' }))
  await user.click(screen.getByRole('button', { name: '收藏这张卡' }))

  expect(screen.getByRole('button', { name: '取消收藏' })).toBeInTheDocument()
  expect(readProgress().bei.favorite).toBe(true)

  await user.click(screen.getByRole('button', { name: '取消收藏' }))

  expect(screen.getByRole('button', { name: '收藏这张卡' })).toBeInTheDocument()
  expect(readProgress().bei.favorite).toBe(false)
})

it('reflects an existing saved favorite when the finish page opens', async () => {
  const user = userEvent.setup()

  localStorage.setItem(
    'hanzi-h5-progress',
    JSON.stringify({
      bei: {
        completed: false,
        favorite: true,
        lastOpenedAt: '2026-04-23T08:00:00.000Z',
      },
    }),
  )

  renderApp('/cards/bei')

  await user.click(screen.getByRole('button', { name: '开始读这张卡' }))
  await user.click(screen.getByRole('button', { name: '下一页' }))
  await user.click(screen.getByRole('button', { name: '下一页' }))
  await user.click(screen.getByRole('button', { name: '下一页' }))
  await user.click(screen.getByRole('button', { name: '下一页' }))

  expect(screen.getByRole('button', { name: '取消收藏' })).toBeInTheDocument()
})

it('shows when story audio is unavailable in this browser on the story page', async () => {
  const user = userEvent.setup()

  Object.defineProperty(window, 'speechSynthesis', {
    configurable: true,
    value: undefined,
  })
  Object.defineProperty(window, 'SpeechSynthesisUtterance', {
    configurable: true,
    value: undefined,
  })

  renderApp('/cards/bei')

  await user.click(screen.getByRole('button', { name: '开始读这张卡' }))

  expect(screen.getByRole('button', { name: '听这个故事' })).toBeDisabled()
  expect(
    screen.getByText('这个浏览器暂时不能播放故事，可以直接读给孩子听。'),
  ).toBeInTheDocument()
})

it('shows a gentle not-found state and lets the family go back home', async () => {
  const user = userEvent.setup()
  vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('not found'))

  renderApp('/cards/missing')

  expect(await screen.findByRole('heading', { name: '这张字卡还在路上' })).toBeInTheDocument()
  expect(screen.getByText('先回首页，我们从今天准备好的故事开始。')).toBeInTheDocument()

  await user.click(screen.getByRole('button', { name: '回首页看看' }))

  expect(screen.getByTestId('location')).toHaveTextContent('/')
  expect(screen.getByText(/今天的故事字/i)).toBeInTheDocument()
})

it('loads a generated private card from the API and saves progress by card id', async () => {
  const user = userEvent.setup()

  vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
    new Response(
      JSON.stringify({
        cardId: 'priv-mu-001',
        access: 'ready_private',
        card: {
          slug: 'generated-mu',
          character: '木',
          pinyin: 'mu',
          theme: '自然',
          estimatedMinutes: 5,
          heroLine: '今天用一个小故事认识“木”。',
          storyScene: '一棵小树站在阳光里。',
          storyText: '孩子看见树，就容易记住“木”。',
          parentPrompt: '先让孩子看画面，再问像不像树。',
          words: ['木头', '木门', '树木'],
          sentences: ['木门打开了。', '树木长高了。'],
          activityPrompt: '伸开手臂站一站，像一棵树。',
        },
      }),
      {
        status: 200,
        headers: { 'content-type': 'application/json' },
      },
    ),
  )

  renderApp('/cards/priv-mu-001')

  expect(await screen.findByRole('heading', { name: '木' })).toBeInTheDocument()

  await user.click(screen.getByRole('button', { name: '开始读这张卡' }))
  await user.click(screen.getByRole('button', { name: '下一页' }))
  await user.click(screen.getByRole('button', { name: '下一页' }))
  await user.click(screen.getByRole('button', { name: '下一页' }))
  await user.click(screen.getByRole('button', { name: '下一页' }))
  await user.click(screen.getByRole('button', { name: '今天这张读完了' }))

  expect(readProgress()['priv-mu-001']).toMatchObject({
    completed: true,
    character: '木',
    source: 'ready_private',
  })
})
