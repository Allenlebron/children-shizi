import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useLocation } from 'react-router-dom'
import type { CardDocument } from '../../content/types'
import { readProgress } from '../../lib/progress/store'
import { PagedReadingFlow } from './PagedReadingFlow'

const originalSpeechSynthesis = Object.getOwnPropertyDescriptor(window, 'speechSynthesis')
const originalSpeechSynthesisUtterance = Object.getOwnPropertyDescriptor(
  window,
  'SpeechSynthesisUtterance',
)

const curatedDocument: CardDocument = {
  cardId: 'bei',
  access: 'curated',
  card: {
    slug: 'bei',
    character: '北',
    pinyin: 'bei',
    theme: '方向',
    estimatedMinutes: 5,
    heroLine: '今天用一个小故事认识“北”。',
    storyScene: '一个小朋友转过身，背朝前面站着。',
    comic: {
      imageSrc: '/comics/bei.svg',
      alt: '小朋友在雪地里找北方',
      caption: '小朋友穿着厚厚的衣服，站在北风吹来的雪地里。',
      questions: ['你看到哪些地方让人觉得冷？', '北风吹来的时候，小朋友可以怎么保护自己？'],
    },
    storyText:
      '大家慢慢就把这种“转过身、背朝前面”的感觉和“北”连在了一起，所以后来一说北，很多人就会想到方向。',
    parentPrompt: '先和孩子一起看画面，再说“像不像一个人转过去了”。',
    words: ['北边', '北风', '北极熊'],
    sentences: ['北风吹来了。', '北极熊住在北边很冷的地方。'],
    activityPrompt: '我们站起来转一转，找一找哪边是北。',
  },
}

const generatedDocument: CardDocument = {
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
}

function LocationProbe() {
  const { pathname } = useLocation()

  return <div data-testid="location">{pathname}</div>
}

function renderFlow(document: CardDocument = curatedDocument) {
  render(
    <MemoryRouter initialEntries={['/cards/bei']}>
      <LocationProbe />
      <PagedReadingFlow document={document} />
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

it('starts on the scene step and advances through all six reading pages', async () => {
  const user = userEvent.setup()

  renderFlow()

  expect(screen.getByText('1 / 6 · 看画面')).toBeInTheDocument()
  expect(screen.queryByText('先像看绘本一样看一看画面。')).not.toBeInTheDocument()
  expect(screen.getByRole('heading', { name: '北' })).toBeInTheDocument()
  expect(screen.getByRole('img', { name: '小朋友在雪地里找北方' })).toBeInTheDocument()
  expect(screen.getByText('小朋友穿着厚厚的衣服，站在北风吹来的雪地里。')).toBeInTheDocument()
  expect(screen.getByText('你看到哪些地方让人觉得冷？')).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: '上一步' })).not.toBeInTheDocument()

  await user.click(screen.getByRole('button', { name: '开始读这张卡' }))
  expect(screen.getByText('2 / 6 · 听故事')).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: '听 / 讲故事' })).toBeInTheDocument()

  await user.click(screen.getByRole('button', { name: '下一页' }))
  expect(screen.getByText('3 / 6 · 认这个字')).toBeInTheDocument()
  expect(screen.getByText('bei')).toBeInTheDocument()
  expect(screen.getByText('北 · 5 笔')).toBeInTheDocument()
  expect(screen.getByRole('img', { name: '北 的笔顺动画' })).toBeInTheDocument()
  expect(screen.getByText('先和孩子一起看画面，再说“像不像一个人转过去了”。')).toBeInTheDocument()

  await user.click(screen.getByRole('button', { name: '下一页' }))
  expect(screen.getByText('4 / 6 · 读词句')).toBeInTheDocument()
  expect(screen.getByText('北边')).toBeInTheDocument()
  expect(screen.getByText('北风吹来了。')).toBeInTheDocument()

  await user.click(screen.getByRole('button', { name: '下一页' }))
  expect(screen.getByText('5 / 6 · 互动一下')).toBeInTheDocument()
  expect(screen.getByText('我们站起来转一转，找一找哪边是北。')).toBeInTheDocument()

  await user.click(screen.getByRole('button', { name: '下一页' }))
  expect(screen.getByText('6 / 6 · 完成')).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: '今天这张读完了' })).toBeInTheDocument()
})

it('lets the family go back to the previous reading page', async () => {
  const user = userEvent.setup()

  renderFlow()

  await user.click(screen.getByRole('button', { name: '开始读这张卡' }))
  expect(screen.getByRole('heading', { name: '听 / 讲故事' })).toBeInTheDocument()

  await user.click(screen.getByRole('button', { name: '上一步' }))

  expect(screen.getByRole('heading', { name: '北' })).toBeInTheDocument()
  expect(screen.getByText('1 / 6 · 看画面')).toBeInTheDocument()
})

it('speaks the story aloud from the story page', async () => {
  const user = userEvent.setup()
  const speak = vi.fn()

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

  renderFlow()

  await user.click(screen.getByRole('button', { name: '开始读这张卡' }))
  await user.click(screen.getByRole('button', { name: '听这个故事' }))

  expect(speak).toHaveBeenCalledTimes(1)
  expect(speak.mock.calls[0]?.[0]).toMatchObject({ text: curatedDocument.card.storyText })
})

it('speaks words and sentences from the language page', async () => {
  const user = userEvent.setup()
  const speak = vi.fn()

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

  renderFlow()

  await user.click(screen.getByRole('button', { name: '开始读这张卡' }))
  await user.click(screen.getByRole('button', { name: '下一页' }))
  await user.click(screen.getByRole('button', { name: '下一页' }))

  expect(screen.queryByText('听')).not.toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: '点读 北边' }))
  expect(speak).toHaveBeenLastCalledWith(expect.objectContaining({ text: '北边' }))

  await user.click(screen.getByRole('button', { name: '点读 北风吹来了。' }))
  expect(speak).toHaveBeenLastCalledWith(expect.objectContaining({ text: '北风吹来了。' }))
})

it('shows a gentle fallback when story audio is unavailable', async () => {
  const user = userEvent.setup()

  Object.defineProperty(window, 'speechSynthesis', {
    configurable: true,
    value: undefined,
  })
  Object.defineProperty(window, 'SpeechSynthesisUtterance', {
    configurable: true,
    value: undefined,
  })

  renderFlow()

  await user.click(screen.getByRole('button', { name: '开始读这张卡' }))

  expect(screen.getByRole('button', { name: '听这个故事' })).toBeDisabled()
  expect(
    screen.getByText('这个浏览器暂时不能播放故事，可以直接读给孩子听。'),
  ).toBeInTheDocument()
})

it('disables word and sentence read-aloud when audio is unavailable', async () => {
  const user = userEvent.setup()

  Object.defineProperty(window, 'speechSynthesis', {
    configurable: true,
    value: undefined,
  })
  Object.defineProperty(window, 'SpeechSynthesisUtterance', {
    configurable: true,
    value: undefined,
  })

  renderFlow()

  await user.click(screen.getByRole('button', { name: '开始读这张卡' }))
  await user.click(screen.getByRole('button', { name: '下一页' }))
  await user.click(screen.getByRole('button', { name: '下一页' }))

  expect(screen.getByRole('button', { name: '点读 北边' })).toBeDisabled()
  expect(
    screen.getByText('这个浏览器暂时不能点读词句，可以家长读给孩子听。'),
  ).toBeInTheDocument()
})

it('favorites and completes the card from the finish page', async () => {
  const user = userEvent.setup()

  renderFlow()

  await user.click(screen.getByRole('button', { name: '开始读这张卡' }))
  await user.click(screen.getByRole('button', { name: '下一页' }))
  await user.click(screen.getByRole('button', { name: '下一页' }))
  await user.click(screen.getByRole('button', { name: '下一页' }))
  await user.click(screen.getByRole('button', { name: '下一页' }))
  await user.click(screen.getByRole('button', { name: '收藏这张卡' }))
  await user.click(screen.getByRole('button', { name: '今天这张读完了' }))

  expect(readProgress().bei).toMatchObject({
    cardId: 'bei',
    character: '北',
    source: 'curated',
    completed: true,
    favorite: true,
  })
  expect(screen.getByTestId('location')).toHaveTextContent('/')
})

it('uses generated card ids and access source when saving progress', async () => {
  const user = userEvent.setup()

  renderFlow(generatedDocument)

  await user.click(screen.getByRole('button', { name: '开始读这张卡' }))
  await user.click(screen.getByRole('button', { name: '下一页' }))
  await user.click(screen.getByRole('button', { name: '下一页' }))
  await user.click(screen.getByRole('button', { name: '下一页' }))
  await user.click(screen.getByRole('button', { name: '下一页' }))
  await user.click(screen.getByRole('button', { name: '今天这张读完了' }))

  expect(readProgress()['priv-mu-001']).toMatchObject({
    cardId: 'priv-mu-001',
    character: '木',
    source: 'ready_private',
    completed: true,
  })
})
