# Reading Delight Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the existing reading flow feel more playful and legible by adding a leaf progress rail, a gentle finish celebration, and layered homepage entry motion.

**Architecture:** Keep the existing React routes and card data flow unchanged. Extend `PagedReadingFlow` with presentational step progress and a short finish state before returning home, and add CSS animation hooks to the existing homepage cards rather than introducing new libraries or canvas effects.

**Tech Stack:** React, React Router, CSS keyframes, Testing Library, Vitest, Vite.

---

### Task 1: Leaf Progress Rail

**Files:**
- Modify: `app/src/features/card/PagedReadingFlow.tsx`
- Test: `app/src/features/card/PagedReadingFlow.test.tsx`
- Modify: `app/src/styles/global.css`

- [ ] Add a failing reading-flow test that expects six labeled leaf progress markers and an active marker for the current step.
- [ ] Run `npx vitest run src/features/card/PagedReadingFlow.test.tsx --pool forks` and confirm the progress marker assertion fails.
- [ ] Render progress markers from the existing `steps` array so the marker state follows `stepIndex`.
- [ ] Style the marker rail as a compact leaf path that keeps the existing text pill readable.
- [ ] Re-run the focused reading-flow test and confirm it passes.

### Task 2: Finish Celebration

**Files:**
- Modify: `app/src/features/card/PagedReadingFlow.tsx`
- Test: `app/src/features/card/PagedReadingFlow.test.tsx`
- Modify: `app/src/styles/global.css`

- [ ] Add a failing test that clicking the finish button shows `小树又长大一点啦` before the homepage navigation runs.
- [ ] Run the focused reading-flow test and confirm the celebration assertion fails.
- [ ] Add a short `isFinishing` state and timer cleanup that marks progress, shows a CSS leaf/star burst, then navigates home.
- [ ] Keep the existing completion button accessible and disable it while the celebration is playing.
- [ ] Re-run the focused reading-flow test and confirm it passes.

### Task 3: Homepage Arrival Rhythm

**Files:**
- Modify: `app/src/features/home/HomePage.tsx`
- Test: `app/src/features/home/HomePage.test.tsx`
- Modify: `app/src/styles/global.css`

- [ ] Add a failing homepage test that expects the daily, search, and review cards to expose staged entry hooks.
- [ ] Run `npx vitest run src/features/home/HomePage.test.tsx --pool forks` and confirm the hook assertion fails.
- [ ] Add stable entry classes to the existing homepage cards and stagger their `slideUp` keyframe delays in CSS.
- [ ] Respect the existing reduced-motion override so staged entry motion collapses when motion is reduced.
- [ ] Re-run the focused homepage test and confirm it passes.

### Task 4: Verification

**Files:**
- Verify only.

- [ ] Inspect `/`, `/cards/bei`, and the finish step locally in the in-app browser when available.
- [ ] Run `npm run lint`.
- [ ] Run `npx vitest run --pool forks --maxWorkers=1`.
- [ ] Run `npm run build`.
