# Card Comic Scene Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a single comic-style scene image to the first reading page for an initial set of cached Hanzi cards.

**Architecture:** Extend `HanziCard` with an optional `comic` object containing an image URL, alt text, caption, and parent-led observation questions. The scene page renders the comic when present and falls back to the existing text-only scene for generated cards or cached cards without comic art.

**Tech Stack:** React, TypeScript, Vite public assets, Vitest, Testing Library, CSS.

---

### Task 1: Comic Data Contract

**Files:**
- Modify: `app/src/content/types.ts`
- Modify: `app/src/content/cards/index.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
it('adds comic scene metadata to the first MVP sample cards', () => {
  expect(['北', '水', '火', '木'].map((character) => findCardByQuery(character)?.comic?.imageSrc)).toEqual([
    '/comics/bei.svg',
    '/comics/shui.svg',
    '/comics/huo.svg',
    '/comics/mu.svg',
  ])
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/content/cards/index.test.ts`

Expected: FAIL because `comic` is currently missing from the card data.

- [ ] **Step 3: Add the minimal type**

```ts
export interface HanziComicScene {
  imageSrc: string
  alt: string
  caption: string
  questions: string[]
}
```

- [ ] **Step 4: Run test to verify it passes after content is added in Task 3**

Run: `npm test -- src/content/cards/index.test.ts`

Expected: PASS.

### Task 2: Scene Page Rendering

**Files:**
- Modify: `app/src/features/card/PagedReadingFlow.test.tsx`
- Modify: `app/src/features/card/PagedReadingFlow.tsx`
- Modify: `app/src/styles/global.css`

- [ ] **Step 1: Write the failing test**

```tsx
expect(screen.getByRole('img', { name: '小朋友在雪地里找北方' })).toBeInTheDocument()
expect(screen.getByText('你看到哪些地方让人觉得冷？')).toBeInTheDocument()
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/features/card/PagedReadingFlow.test.tsx`

Expected: FAIL because the scene page only renders text today.

- [ ] **Step 3: Render comic scene when present**

```tsx
{card.comic ? (
  <figure className="reading-comic-frame">
    <img src={card.comic.imageSrc} alt={card.comic.alt} />
    <figcaption>{card.comic.caption}</figcaption>
  </figure>
) : (
  <div className="reading-scene-box">
    <p>{card.storyScene || '我们先看一看这幅小画面。'}</p>
  </div>
)}
```

- [ ] **Step 4: Run focused test**

Run: `npm test -- src/features/card/PagedReadingFlow.test.tsx`

Expected: PASS.

### Task 3: Initial Comic Assets

**Files:**
- Create: `app/public/comics/bei.svg`
- Create: `app/public/comics/shui.svg`
- Create: `app/public/comics/huo.svg`
- Create: `app/public/comics/mu.svg`
- Modify: `app/src/content/cards/bei.ts`
- Modify: `app/src/content/cards/mvp-cache.ts`

- [ ] **Step 1: Add four static SVG scenes**

Each SVG uses the existing forest storybook palette, rounded backgrounds, simple cartoon characters, and no external dependencies.

- [ ] **Step 2: Wire comic metadata**

`北` uses `/comics/bei.svg`, `水` uses `/comics/shui.svg`, `火` uses `/comics/huo.svg`, and `木` uses `/comics/mu.svg`.

- [ ] **Step 3: Validate**

Run:

```bash
npm test -- src/content/cards/index.test.ts src/features/card/PagedReadingFlow.test.tsx
npm run lint
npm test
VITE_HANZI_API_BASE_URL=https://family-generated-search-api.myzwilpan.workers.dev npm run build
```

Expected: all commands pass.
