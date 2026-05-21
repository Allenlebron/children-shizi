# Visual Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve the existing H5 app's child-friendly visual quality without adding new features or changing core flows.

**Architecture:** Keep React components, routes, data, search, card reading, and review logic unchanged. Apply a focused CSS-only polish in `app/src/styles/global.css` to improve page hierarchy, storybook atmosphere, buttons, reading cards, review cards, and bottom navigation.

**Tech Stack:** React, Vite, CSS, existing Vitest and browser verification.

---

### Task 1: Storybook Visual System

**Files:**
- Modify: `app/src/styles/global.css`

- [ ] Strengthen global color tokens, background atmosphere, shadows, paper texture, button styling, and navigation lightness.
- [ ] Keep existing class names and DOM structure so current tests remain valid.
- [ ] Run `npm run lint` and `npm run build`.

### Task 2: Page-Level Polish

**Files:**
- Modify: `app/src/styles/global.css`

- [ ] Polish homepage daily card, review entry, and search card hierarchy.
- [ ] Polish reading page variants: scene, story, character, language, activity, and finish.
- [ ] Polish review quest card, options, feedback message, and completion state.
- [ ] Verify in the browser on `/`, `/cards/bei`, and `/review`.

### Task 3: Regression Verification

**Files:**
- Verify only.

- [ ] Run `npx vitest run --pool forks`.
- [ ] Run `npm run lint`.
- [ ] Run `npm run build`.
