# Hanzi H5 Paged Reading Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current long scrolling card learning page with a 6-step picture-book-style paged reading flow.

**Architecture:** Keep `CardPage` responsible for loading curated or generated card documents, then delegate the normal learning UI to a new focused `PagedReadingFlow` component. The new component derives six front-end-only steps from the existing `HanziCard` fields, manages the current step locally, and reuses the existing audio and local progress helpers.

**Tech Stack:** React 19, React Router 7, TypeScript, Vite, Vitest, Testing Library, existing browser `speechSynthesis` wrapper, existing `localStorage` progress store.

---

## File Structure

- Create `app/src/features/card/PagedReadingFlow.tsx`
  - Owns the six-step reading experience, current step state, progress footer, story audio, favorite toggle, and completion action.
- Create `app/src/features/card/PagedReadingFlow.test.tsx`
  - Component-level tests for step navigation, audio, favorite state, completion, and generated-card snapshot metadata.
- Modify `app/src/features/card/CardPage.tsx`
  - Remove the old long-page normal-state markup and render `PagedReadingFlow` after `CardDocument` loads.
- Modify `app/src/features/card/CardPage.test.tsx`
  - Update page-level tests from long-scroll assertions to paged-flow assertions while preserving not-found and generated-card API coverage.
- Modify `app/src/app/App.flow.test.tsx`
  - Update the daily-card completion flow to navigate through the paged finish step before marking complete.
- Modify `app/src/app/App.test.tsx`
  - Keep shell expectations aligned with the new first screen heading/copy.
- Modify `app/src/styles/global.css`
  - Replace or supersede old `.card-storybook`, `.card-hero`, `.card-story-panel`, `.card-actions`, `.card-finish` styles with paged-reading layout classes.

---

## Task 1: Add Paged Reading Component Tests First

**Files:**
- Create: `app/src/features/card/PagedReadingFlow.test.tsx`
- Future implementation target: `app/src/features/card/PagedReadingFlow.tsx`

- [ ] **Step 1: Write the failing component tests**

Create `app/src/features/card/PagedReadingFlow.test.tsx` with this content:

```tsx
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

  expect(screen.getByText('第 1 / 6 页')).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: '北' })).toBeInTheDocument()
  expect(screen.getByText('一个小朋友转过身，背朝前面站着。')).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: '上一步' })).not.toBeInTheDocument()

  await user.click(screen.getByRole('button', { name: '开始读这张卡' }))
  expect(screen.getByText('第 2 / 6 页')).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: '听 / 讲故事' })).toBeInTheDocument()

  await user.click(screen.getByRole('button', { name: '下一页' }))
  expect(screen.getByText('第 3 / 6 页')).toBeInTheDocument()
  expect(screen.getByText('bei')).toBeInTheDocument()
  expect(screen.getByText('先和孩子一起看画面，再说“像不像一个人转过去了”。')).toBeInTheDocument()

  await user.click(screen.getByRole('button', { name: '下一页' }))
  expect(screen.getByText('第 4 / 6 页')).toBeInTheDocument()
  expect(screen.getByText('北边')).toBeInTheDocument()
  expect(screen.getByText('北风吹来了。')).toBeInTheDocument()

  await user.click(screen.getByRole('button', { name: '下一页' }))
  expect(screen.getByText('第 5 / 6 页')).toBeInTheDocument()
  expect(screen.getByText('我们站起来转一转，找一找哪边是北。')).toBeInTheDocument()

  await user.click(screen.getByRole('button', { name: '下一页' }))
  expect(screen.getByText('第 6 / 6 页')).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: '今天这张读完了' })).toBeInTheDocument()
})

it('lets the family go back to the previous reading page', async () => {
  const user = userEvent.setup()

  renderFlow()

  await user.click(screen.getByRole('button', { name: '开始读这张卡' }))
  expect(screen.getByRole('heading', { name: '听 / 讲故事' })).toBeInTheDocument()

  await user.click(screen.getByRole('button', { name: '上一步' }))

  expect(screen.getByRole('heading', { name: '北' })).toBeInTheDocument()
  expect(screen.getByText('第 1 / 6 页')).toBeInTheDocument()
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
```

- [ ] **Step 2: Run the component test to verify it fails**

Run:

```bash
cd app
npm test -- src/features/card/PagedReadingFlow.test.tsx
```

Expected: FAIL because `./PagedReadingFlow` does not exist.

- [ ] **Step 3: Commit the failing test**

Run:

```bash
git add app/src/features/card/PagedReadingFlow.test.tsx
git commit -m "test: cover paged reading flow"
```

Expected: commit succeeds with only the new failing test file.

---

## Task 2: Implement `PagedReadingFlow`

**Files:**
- Create: `app/src/features/card/PagedReadingFlow.tsx`
- Test: `app/src/features/card/PagedReadingFlow.test.tsx`

- [ ] **Step 1: Add the component implementation**

Create `app/src/features/card/PagedReadingFlow.tsx` with this content:

```tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { CardDocument } from '../../content/types'
import { speak, supportsSpeechSynthesis } from '../../lib/audio/speak'
import { markCompleted, readProgress, toggleFavorite } from '../../lib/progress/store'

type ReadingStepKey = 'scene' | 'story' | 'character' | 'language' | 'activity' | 'finish'

type PagedReadingFlowProps = {
  document: CardDocument
}

const steps: Array<{ key: ReadingStepKey; label: string }> = [
  { key: 'scene', label: '看画面' },
  { key: 'story', label: '听故事' },
  { key: 'character', label: '认这个字' },
  { key: 'language', label: '读词句' },
  { key: 'activity', label: '互动一下' },
  { key: 'finish', label: '完成' },
]

function getSafeList(items: string[], fallback: string) {
  return items.length > 0 ? items : [fallback]
}

export function PagedReadingFlow({ document }: PagedReadingFlowProps) {
  const navigate = useNavigate()
  const { card, access } = document
  const [stepIndex, setStepIndex] = useState(0)
  const [isFavorite, setIsFavorite] = useState(
    () => readProgress()[document.cardId]?.favorite ?? false,
  )
  const canPlayStory = supportsSpeechSynthesis()
  const currentStep = steps[stepIndex]
  const isFirstStep = stepIndex === 0
  const isLastStep = stepIndex === steps.length - 1
  const snapshot = {
    cardId: document.cardId,
    character: card.character,
    source: access,
  } as const

  function goNext() {
    setStepIndex((current) => Math.min(current + 1, steps.length - 1))
  }

  function goBack() {
    setStepIndex((current) => Math.max(current - 1, 0))
  }

  function finishCard() {
    markCompleted(snapshot)
    navigate('/')
  }

  function toggleCardFavorite() {
    toggleFavorite(snapshot)
    setIsFavorite((currentFavorite) => !currentFavorite)
  }

  return (
    <article className="paged-reading" aria-label={`${card.character} 的绘本识字流程`}>
      <header className="reading-topbar">
        <p className="reading-progress-copy">第 {stepIndex + 1} / {steps.length} 页</p>
        <div
          className="reading-progress-track"
          aria-label={`阅读进度 ${stepIndex + 1} / ${steps.length}`}
        >
          <span style={{ width: `${((stepIndex + 1) / steps.length) * 100}%` }} />
        </div>
        <p className="reading-step-label">{currentStep.label}</p>
      </header>

      <section className="reading-page-card">
        {currentStep.key === 'scene' ? (
          <>
            <p className="card-section-label">故事画面</p>
            <div className="reading-scene-box">
              <p>{card.storyScene || '我们先看一看这幅小画面。'}</p>
            </div>
            <h1 className="reading-character">{card.character}</h1>
            <p className="reading-hero-line">{card.heroLine || `今天认识“${card.character}”。`}</p>
          </>
        ) : null}

        {currentStep.key === 'story' ? (
          <>
            <h1 className="reading-page-heading">听 / 讲故事</h1>
            <p className="reading-story-text">
              {card.storyText || '这一页我们慢慢看图说一说。'}
            </p>
            <div className="reading-action-grid">
              <button
                type="button"
                disabled={!canPlayStory}
                aria-describedby={canPlayStory ? undefined : 'story-audio-hint'}
                onClick={() => speak(card.storyText)}
              >
                听这个故事
              </button>
              <button className="button-secondary" type="button">
                我来慢慢讲
              </button>
            </div>
            {canPlayStory ? null : (
              <p className="card-action-hint" id="story-audio-hint">
                这个浏览器暂时不能播放故事，可以直接读给孩子听。
              </p>
            )}
          </>
        ) : null}

        {currentStep.key === 'character' ? (
          <>
            <p className="card-section-label">认这个字</p>
            <h1 className="reading-character reading-character-large">{card.character}</h1>
            <p className="reading-pinyin">{card.pinyin}</p>
            <div className="reading-parent-note">
              <p>{card.parentPrompt || '先和孩子一起看画面，再慢慢说出这个字。'}</p>
            </div>
          </>
        ) : null}

        {currentStep.key === 'language' ? (
          <>
            <h1 className="reading-page-heading">词和句子</h1>
            <div className="reading-language-section">
              <p className="card-mini-heading">词</p>
              <ul className="reading-pill-list">
                {getSafeList(card.words, `关于“${card.character}”的词`).map((word) => (
                  <li key={word}>{word}</li>
                ))}
              </ul>
            </div>
            <div className="reading-language-section">
              <p className="card-mini-heading">句子</p>
              <ul className="card-bullet-list">
                {getSafeList(card.sentences, '这一段我们先慢慢看图说一说。').map((sentence) => (
                  <li key={sentence}>{sentence}</li>
                ))}
              </ul>
            </div>
          </>
        ) : null}

        {currentStep.key === 'activity' ? (
          <>
            <h1 className="reading-page-heading">互动一下</h1>
            <p className="reading-story-text">
              {card.activityPrompt || '我们一起找一找、说一说这个字。'}
            </p>
            <button type="button">我们试试看</button>
          </>
        ) : null}

        {currentStep.key === 'finish' ? (
          <>
            <p className="card-section-label">完成收尾</p>
            <h1 className="reading-page-heading">今天这张读完了</h1>
            <p className="reading-story-text">
              可以夸孩子一句：你刚才认真听完了一个故事。
            </p>
            <div className="reading-action-grid">
              <button className="button-secondary" type="button" onClick={toggleCardFavorite}>
                {isFavorite ? '取消收藏' : '收藏这张卡'}
              </button>
              <button type="button" onClick={finishCard}>
                今天这张读完了
              </button>
            </div>
          </>
        ) : null}
      </section>

      <nav className="reading-footer" aria-label="阅读步骤">
        {isFirstStep ? <span /> : (
          <button className="button-secondary" type="button" onClick={goBack}>
            上一步
          </button>
        )}
        {isLastStep ? null : (
          <button type="button" onClick={goNext}>
            {isFirstStep ? '开始读这张卡' : '下一页'}
          </button>
        )}
      </nav>
    </article>
  )
}
```

- [ ] **Step 2: Run the component tests**

Run:

```bash
cd app
npm test -- src/features/card/PagedReadingFlow.test.tsx
```

Expected: PASS for all `PagedReadingFlow` tests.

- [ ] **Step 3: Commit the component implementation**

Run:

```bash
git add app/src/features/card/PagedReadingFlow.tsx app/src/features/card/PagedReadingFlow.test.tsx
git commit -m "feat: add paged reading flow"
```

Expected: commit succeeds with component and test files.

---

## Task 3: Wire `CardPage` To The New Flow

**Files:**
- Modify: `app/src/features/card/CardPage.tsx`
- Modify: `app/src/features/card/CardPage.test.tsx`

- [ ] **Step 1: Write page-level expectations for the new flow**

In `app/src/features/card/CardPage.test.tsx`, replace the first test named `renders the card story flow and speaks the story aloud` with:

```tsx
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
```

Replace the test named `saves progress when the family favorites and completes a card` with:

```tsx
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
```

Replace the test named `shows honest favorite button copy as the saved favorite state changes` with:

```tsx
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
```

Replace the test named `reflects an existing saved favorite when the card page opens` with:

```tsx
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
```

Replace the test named `shows when story audio is unavailable in this browser` with:

```tsx
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
```

Delete the old test named `moves focus to the reading section when the family chooses to read slowly` because `我来慢慢讲` no longer scrolls to a separate section in the paged design.

In the generated-card test, replace:

```tsx
expect(await screen.findByRole('heading', { name: '木' })).toBeInTheDocument()

await user.click(screen.getByRole('button', { name: '今天这张读完了' }))
```

with:

```tsx
expect(await screen.findByRole('heading', { name: '木' })).toBeInTheDocument()

await user.click(screen.getByRole('button', { name: '开始读这张卡' }))
await user.click(screen.getByRole('button', { name: '下一页' }))
await user.click(screen.getByRole('button', { name: '下一页' }))
await user.click(screen.getByRole('button', { name: '下一页' }))
await user.click(screen.getByRole('button', { name: '下一页' }))
await user.click(screen.getByRole('button', { name: '今天这张读完了' }))
```

- [ ] **Step 2: Run the page test and verify it fails before wiring**

Run:

```bash
cd app
npm test -- src/features/card/CardPage.test.tsx
```

Expected: FAIL because `CardPage` still renders the old long scrolling markup.

- [ ] **Step 3: Wire `CardPage` to `PagedReadingFlow`**

In `app/src/features/card/CardPage.tsx`, add this import:

```tsx
import { PagedReadingFlow } from './PagedReadingFlow'
```

Remove these imports because the normal-state UI no longer uses them directly:

```tsx
import { useRef, useState } from 'react'
import { speak, supportsSpeechSynthesis } from '../../lib/audio/speak'
import { markCompleted, readProgress, toggleFavorite } from '../../lib/progress/store'
```

Keep this import shape instead:

```tsx
import { useEffect, useState } from 'react'
```

Remove this declaration:

```tsx
const readingFlowRef = useRef<HTMLElement | null>(null)
```

Remove this declaration because `PagedReadingFlow` owns favorite state:

```tsx
const [isFavorite, setIsFavorite] = useState(false)
```

Remove this declaration:

```tsx
const canPlayStory = supportsSpeechSynthesis()
```

Inside the curated-card branch of the `useEffect`, remove this line:

```tsx
setIsFavorite(readProgress()[cardId]?.favorite ?? false)
```

Inside the generated-card `then` handler, replace:

```tsx
setIsFavorite(nextDocument ? (readProgress()[nextDocument.cardId]?.favorite ?? false) : false)
```

with no code. The `then` handler should only call:

```tsx
setDocument(nextDocument)
```

Replace everything from:

```tsx
const { card, access } = document
const snapshot = {
  cardId: document.cardId,
  character: card.character,
  source: access,
} as const

return (
  <article className="card-storybook">
```

through the matching closing:

```tsx
  </article>
)
```

with:

```tsx
return <PagedReadingFlow document={document} />
```

After this edit, `CardPage` should still keep its loading and not-found branches unchanged.

- [ ] **Step 4: Run the page tests**

Run:

```bash
cd app
npm test -- src/features/card/CardPage.test.tsx
```

Expected: PASS for all `CardPage` tests.

- [ ] **Step 5: Commit the page wiring**

Run:

```bash
git add app/src/features/card/CardPage.tsx app/src/features/card/CardPage.test.tsx
git commit -m "feat: render cards with paged reading flow"
```

Expected: commit succeeds with `CardPage` and its updated tests.

---

## Task 4: Update App Flow Tests For Paged Completion

**Files:**
- Modify: `app/src/app/App.flow.test.tsx`
- Modify: `app/src/app/App.test.tsx`

- [ ] **Step 1: Update the daily-card flow test**

In `app/src/app/App.flow.test.tsx`, replace:

```tsx
await user.click(screen.getByRole('button', { name: '今天这张读完了' }))
```

with:

```tsx
await user.click(screen.getByRole('button', { name: '开始读这张卡' }))
await user.click(screen.getByRole('button', { name: '下一页' }))
await user.click(screen.getByRole('button', { name: '下一页' }))
await user.click(screen.getByRole('button', { name: '下一页' }))
await user.click(screen.getByRole('button', { name: '下一页' }))
await user.click(screen.getByRole('button', { name: '今天这张读完了' }))
```

- [ ] **Step 2: Keep the shell card-route test aligned with the new first screen**

In `app/src/app/App.test.tsx`, replace this assertion:

```tsx
expect(screen.getByRole('heading', { name: /学习页/i })).toBeInTheDocument()
```

with:

```tsx
expect(screen.getByText('第 1 / 6 页')).toBeInTheDocument()
expect(screen.getByRole('heading', { name: /北/i })).toBeInTheDocument()
```

- [ ] **Step 3: Run app-level tests**

Run:

```bash
cd app
npm test -- src/app/App.flow.test.tsx src/app/App.test.tsx
```

Expected: PASS for both app-level test files.

- [ ] **Step 4: Commit the app-flow test updates**

Run:

```bash
git add app/src/app/App.flow.test.tsx app/src/app/App.test.tsx
git commit -m "test: update app flows for paged reading"
```

Expected: commit succeeds with app-level tests.

---

## Task 5: Add Paged Reading Visual Styles

**Files:**
- Modify: `app/src/styles/global.css`
- Test manually in browser after automated checks.

- [ ] **Step 1: Add the paged-reading CSS**

In `app/src/styles/global.css`, add this block after the `.button-secondary` rule:

```css
.paged-reading {
  display: grid;
  gap: 14px;
  max-width: 420px;
  min-height: calc(100vh - 168px);
  margin: 0 auto;
}

.reading-topbar {
  display: grid;
  gap: 8px;
  padding: 14px 16px;
  border: 1px solid rgba(200, 109, 63, 0.16);
  border-radius: 22px;
  background: rgba(255, 250, 243, 0.82);
  box-shadow: 0 12px 28px rgba(90, 62, 34, 0.08);
}

.reading-progress-copy,
.reading-step-label {
  margin: 0;
  color: #8a7154;
  font-size: 13px;
}

.reading-step-label {
  color: #8c512f;
  font-weight: 600;
}

.reading-progress-track {
  height: 8px;
  overflow: hidden;
  border-radius: 999px;
  background: #efd8bd;
}

.reading-progress-track span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #c86d3f, #e5a45f);
  transition: width 180ms ease;
}

.reading-page-card {
  display: grid;
  align-content: center;
  gap: 18px;
  min-height: 430px;
  padding: 24px;
  border-radius: 30px;
  background:
    radial-gradient(circle at top, rgba(255, 251, 243, 0.98), rgba(247, 225, 196, 0.92)),
    rgba(255, 250, 243, 0.94);
  box-shadow: 0 18px 40px rgba(90, 62, 34, 0.12);
}

.reading-scene-box {
  display: grid;
  place-items: center;
  min-height: 132px;
  padding: 18px;
  border-radius: 26px;
  background:
    linear-gradient(135deg, rgba(255, 247, 238, 0.96), rgba(246, 225, 200, 0.9)),
    #f6e1c8;
}

.reading-scene-box p {
  margin: 0;
  color: #684329;
  font-size: 19px;
  line-height: 1.7;
  text-align: center;
}

.reading-character {
  margin: 8px 0 0;
  font-size: 88px;
  font-weight: 600;
  line-height: 1;
  text-align: center;
}

.reading-character-large {
  font-size: 112px;
}

.reading-hero-line,
.reading-pinyin {
  margin: 0;
  font-size: 20px;
  text-align: center;
}

.reading-pinyin {
  color: #8a7154;
  font-size: 18px;
}

.reading-page-heading {
  margin: 0;
  font-size: 28px;
  line-height: 1.2;
  text-align: center;
}

.reading-story-text {
  margin: 0;
  font-size: 20px;
  line-height: 1.8;
}

.reading-parent-note {
  padding: 18px;
  border-radius: 22px;
  background: rgba(255, 250, 243, 0.72);
}

.reading-parent-note p {
  margin: 0;
  line-height: 1.7;
}

.reading-action-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.reading-language-section {
  display: grid;
  gap: 10px;
}

.reading-pill-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.reading-pill-list li {
  padding: 10px 14px;
  border-radius: 999px;
  background: rgba(255, 250, 243, 0.78);
  color: #684329;
  font-size: 18px;
}

.reading-footer {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.25fr);
  gap: 12px;
  align-items: center;
}

.reading-footer button {
  width: 100%;
}
```

In the existing desktop media query, replace:

```css
.hero-card,
.hero-stack,
.panel-card,
.card-storybook {
  max-width: 480px;
}
```

with:

```css
.hero-card,
.hero-stack,
.panel-card,
.card-storybook,
.paged-reading {
  max-width: 480px;
}
```

- [ ] **Step 2: Run style-safe automated checks**

Run:

```bash
cd app
npm test -- src/features/card/PagedReadingFlow.test.tsx src/features/card/CardPage.test.tsx
npm run build
```

Expected: tests PASS and build exits 0.

- [ ] **Step 3: Commit the styles**

Run:

```bash
git add app/src/styles/global.css
git commit -m "style: polish paged reading flow"
```

Expected: commit succeeds with CSS changes.

---

## Task 6: Full Verification And Browser Smoke Test

**Files:**
- No planned source edits unless verification finds a bug.

- [ ] **Step 1: Run the full app test suite**

Run:

```bash
cd app
npm test
```

Expected: all app tests pass.

- [ ] **Step 2: Run the production build**

Run:

```bash
cd app
npm run build
```

Expected: TypeScript and Vite build exit 0.

- [ ] **Step 3: Start the local app**

Run:

```bash
cd app
npm run dev -- --ip 127.0.0.1 --port 5173
```

Expected: Vite starts at `http://127.0.0.1:5173/`.

- [ ] **Step 4: Smoke test in the browser**

Open `http://127.0.0.1:5173/cards/bei`.

Verify these visible states:

- First page shows `第 1 / 6 页`, `故事画面`, the large `北`, and `开始读这张卡`
- Clicking `开始读这张卡` shows `第 2 / 6 页` and `听 / 讲故事`
- Clicking `下一页` repeatedly reaches `第 6 / 6 页`
- Finish page shows `收藏这张卡` and `今天这张读完了`
- Clicking `今天这张读完了` returns to the homepage

- [ ] **Step 5: Commit any verification fixes**

If the smoke test reveals a bug, fix only that bug, run:

```bash
cd app
npm test
npm run build
```

Then commit:

```bash
git add app/src
git commit -m "fix: stabilize paged reading flow"
```

Expected: only necessary verification fixes are committed.

---

## Final Checklist

- [ ] `cd app && npm test` passes
- [ ] `cd app && npm run build` passes
- [ ] Browser smoke test confirms the six-step flow on `/cards/bei`
- [ ] `git status --short --branch` shows a clean working tree or only intentional untracked local visual-companion files under `.superpowers/`
- [ ] The feature branch is ready to push or deploy after user approval
