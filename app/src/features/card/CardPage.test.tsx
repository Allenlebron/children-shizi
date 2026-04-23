import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useLocation } from 'react-router-dom'
import App from '../../app/App'
import { getCardBySlug } from '../../content/cards'

const originalSpeechSynthesis = Object.getOwnPropertyDescriptor(window, 'speechSynthesis')
const originalSpeechSynthesisUtterance = Object.getOwnPropertyDescriptor(
  window,
  'SpeechSynthesisUtterance',
)
const originalScrollIntoView = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'scrollIntoView')

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
  restoreWindowProperty('speechSynthesis', originalSpeechSynthesis)
  restoreWindowProperty('SpeechSynthesisUtterance', originalSpeechSynthesisUtterance)

  if (originalScrollIntoView) {
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', originalScrollIntoView)
  } else {
    Reflect.deleteProperty(HTMLElement.prototype, 'scrollIntoView')
  }
})

it('renders the card story flow and speaks the story aloud', async () => {
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

  expect(screen.getByText('故事画面')).toBeInTheDocument()
  expect(screen.getByText('一个小朋友转过身，背朝前面站着。')).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: '北' })).toBeInTheDocument()
  expect(screen.getByText('今天用一个小故事认识“北”。')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: '听这个故事' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: '我来慢慢讲' })).toBeInTheDocument()
  expect(screen.getByText('家长小提示')).toBeInTheDocument()
  expect(screen.getByText('词和句子')).toBeInTheDocument()
  expect(screen.getByText('我们站起来转一转，找一找哪边是北。')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: '今天这张读完了' })).toBeInTheDocument()

  await user.click(screen.getByRole('button', { name: '听这个故事' }))

  expect(speak).toHaveBeenCalledTimes(1)
  expect(speak.mock.calls[0]?.[0]).toMatchObject({ text: card?.storyText })
})

it('shows when story audio is unavailable in this browser', () => {
  Object.defineProperty(window, 'speechSynthesis', {
    configurable: true,
    value: undefined,
  })
  Object.defineProperty(window, 'SpeechSynthesisUtterance', {
    configurable: true,
    value: undefined,
  })

  renderApp('/cards/bei')

  expect(screen.getByRole('button', { name: '听这个故事' })).toBeDisabled()
  expect(screen.getByText('这个浏览器暂时不能播放故事，可以直接往下读。')).toBeInTheDocument()
})

it('moves focus to the reading section when the family chooses to read slowly', async () => {
  const user = userEvent.setup()

  Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
    configurable: true,
    value: vi.fn(),
  })

  renderApp('/cards/bei')

  await user.click(screen.getByRole('button', { name: '我来慢慢讲' }))

  expect(screen.getByLabelText('慢慢讲给孩子听')).toHaveFocus()
})

it('shows a gentle not-found state and lets the family go back home', async () => {
  const user = userEvent.setup()

  renderApp('/cards/missing')

  expect(screen.getByRole('heading', { name: '这张字卡还在路上' })).toBeInTheDocument()
  expect(screen.getByText('先回首页，我们从今天准备好的故事开始。')).toBeInTheDocument()

  await user.click(screen.getByRole('button', { name: '回首页看看' }))

  expect(screen.getByTestId('location')).toHaveTextContent('/')
  expect(screen.getByText(/今天的故事字/i)).toBeInTheDocument()
})
