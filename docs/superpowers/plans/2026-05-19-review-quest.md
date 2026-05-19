# Review Quest Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a lightweight "小树叶闯关复习" flow that lets a child answer 3 local review questions and collect leaves.

**Architecture:** Add a focused review feature under `app/src/features/review`, keep quiz generation deterministic from cached cards, and store completion locally in the existing progress area. The home page links to `/review`; the route renders a self-contained page with no account or server dependency.

**Tech Stack:** React, React Router, Vitest, Testing Library, localStorage.

---

### Task 1: Review Storage

**Files:**
- Modify: `app/src/lib/progress/store.ts`
- Test: `app/src/lib/progress/store.test.ts`

- [ ] Add tests for recording a review result and reading today's leaf count.
- [ ] Implement `recordReviewResult()` and `readReviewSummary()`.
- [ ] Run `npm test -- src/lib/progress/store.test.ts`.

### Task 2: Review Page

**Files:**
- Create: `app/src/features/review/ReviewPage.tsx`
- Create: `app/src/features/review/ReviewPage.test.tsx`
- Modify: `app/src/app/App.tsx`

- [ ] Add a failing route/flow test for `/review`.
- [ ] Implement a 3-question local review flow with gentle wrong-answer feedback.
- [ ] Record 3 leaves when the quest is completed.
- [ ] Run `npm test -- src/features/review/ReviewPage.test.tsx`.

### Task 3: Home Entry And Styling

**Files:**
- Modify: `app/src/features/home/HomePage.tsx`
- Modify: `app/src/features/home/HomePage.test.tsx`
- Modify: `app/src/styles/global.css`

- [ ] Add a failing home test for the "复习小闯关" entry.
- [ ] Add the home entry card and forest-style review page CSS.
- [ ] Run `npm test -- src/features/home/HomePage.test.tsx src/features/review/ReviewPage.test.tsx`.

### Task 4: Final Verification

**Files:**
- Verify only.

- [ ] Run `npm run lint`.
- [ ] Run `npx vitest run --pool forks`.
- [ ] Run `npm run build`.
