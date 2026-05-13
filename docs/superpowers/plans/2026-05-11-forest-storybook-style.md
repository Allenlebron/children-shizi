# Forest Storybook Style Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the approved forest storybook visual direction across the MVP home, reading, library, profile, and bottom navigation surfaces.

**Architecture:** Keep this as a CSS-first visual iteration with small markup additions where semantic sections make the UI clearer. Do not change route behavior, API behavior, card data shape, or local progress storage.

**Tech Stack:** React 19, React Router, Vite, Vitest, Testing Library, CSS.

---

### Task 1: Shared Forest Theme

**Files:**
- Modify: `app/src/styles/global.css`

- [x] **Step 1: Replace the base palette and page background**

Set root colors to a forest storybook palette, update `body`, `.page-shell`, and `.page-main` with soft gradients and decorative pseudo-elements.

- [x] **Step 2: Restyle shared cards, inputs, buttons, and navigation**

Update `.hero-card`, `.panel-card`, `input`, `button`, `.button-secondary`, `.bottom-nav`, and active nav links with softer radii, warmer shadows, and child-friendly tap targets.

- [x] **Step 3: Verify existing tests still target the same labels**

Run: `npm test`

Expected: all tests pass because text labels and routes remain unchanged.

### Task 2: Home, Library, And Profile Markup

**Files:**
- Modify: `app/src/features/home/HomePage.tsx`
- Modify: `app/src/features/library/LibraryPage.tsx`
- Modify: `app/src/features/profile/ProfilePage.tsx`
- Modify: `app/src/styles/global.css`

- [x] **Step 1: Add visual hooks without changing behavior**

Add decorative helper elements and class names for home mission copy, library shelf items, and profile progress cards.

- [x] **Step 2: Style the new hooks**

Add CSS for mission badges, sticker dots, search helper text, library cards, profile stats, and empty progress copy.

- [x] **Step 3: Verify navigation and progress tests**

Run: `npm test`

Expected: all tests pass, including homepage search, finish-card flow, and profile progress tests.

### Task 3: Reading Flow Polish

**Files:**
- Modify: `app/src/features/card/PagedReadingFlow.tsx`
- Modify: `app/src/styles/global.css`

- [x] **Step 1: Add storybook visual hooks**

Add a progress leaf row, step helper text, and decorative page elements while preserving all button names and headings.

- [x] **Step 2: Restyle reading surfaces**

Update `.paged-reading`, `.reading-topbar`, `.reading-progress-track`, `.reading-page-card`, `.reading-scene-box`, `.reading-footer`, and language chips.

- [x] **Step 3: Verify reading flow tests**

Run: `npm test`

Expected: all reading flow tests pass, including step navigation and speech fallback.

### Task 4: Build And Browser Check

**Files:**
- No new source files.

- [x] **Step 1: Build production assets**

Run: `npm run build`

Expected: TypeScript and Vite build complete successfully.

- [x] **Step 2: Inspect locally in the browser**

Run the local dev server and open the home page, `/cards/bei`, and `/me`.

Expected: pages render with the forest storybook style and remain usable on the mobile-sized browser viewport.

### Task 5: Gentle Motion And Stroke Order

**Files:**
- Create: `app/src/features/card/StrokeOrderAnimation.tsx`
- Create: `app/src/features/card/StrokeOrderAnimation.test.tsx`
- Create: `app/src/features/card/stroke-order-data.ts`
- Modify: `app/src/features/card/PagedReadingFlow.tsx`
- Modify: `app/src/features/card/PagedReadingFlow.test.tsx`
- Modify: `app/src/styles/global.css`

- [x] **Step 1: Write failing tests**

Add tests that require supported characters to show a replayable stroke-order animation, unsupported characters to show a fallback, and the reading flow character page to include the stroke card.

- [x] **Step 2: Verify RED**

Run: `npm test -- src/features/card/StrokeOrderAnimation.test.tsx src/features/card/PagedReadingFlow.test.tsx`

Expected: FAIL because the stroke-order component does not exist yet and the reading page does not render it.

- [x] **Step 3: Implement local stroke-order component**

Add a small local stroke data registry, implement `StrokeOrderAnimation`, and wire it into the character reading page.

- [x] **Step 4: Add gentle motion CSS**

Add page entry, story page, cloud, leaf, card reveal, button, and SVG stroke drawing animation. Add `prefers-reduced-motion` support.

- [x] **Step 5: Verify GREEN**

Run: `npm run lint`, `npm test`, and `npm run build`.

Expected: lint passes, all tests pass, and the production build succeeds.
