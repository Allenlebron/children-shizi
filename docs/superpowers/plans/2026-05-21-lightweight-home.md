# Lightweight Home Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Lighten the homepage into one daily storybook cover with smaller review and search entry points.

**Architecture:** Keep `HomePage` search and navigation logic intact while reducing the rendered first-screen hierarchy. Replace the full review panel with a compact review action, remove daily mission chips and duplicated helper copy, and retune existing CSS classes with small homepage-specific additions.

**Tech Stack:** React, React Router, CSS, Testing Library, Vitest, Vite.

---

### Task 1: Homepage Hierarchy Tests

**Files:**
- Modify: `app/src/features/home/HomePage.test.tsx`

- [ ] Add a failing assertion that the old mission badges are absent on the homepage.
- [ ] Add a failing assertion that review renders as a lightweight leaf entry while its CTA still opens `/review`.
- [ ] Run `npx vitest run src/features/home/HomePage.test.tsx --pool forks` and confirm the hierarchy assertions fail for the old layout.

### Task 2: Homepage Structure

**Files:**
- Modify: `app/src/features/home/HomePage.tsx`

- [ ] Remove the daily mission chip row and repeated explanatory helper line from the hero card.
- [ ] Keep the daily Hanzi, story invitation, and primary CTA as the dominant cover content.
- [ ] Replace the large review card with a compact leaf entry that keeps the leaf count and review navigation.
- [ ] Keep the search form and generated-card loading feedback lower in the stack.

### Task 3: Homepage Styling

**Files:**
- Modify: `app/src/styles/global.css`

- [ ] Reduce the hero card height, background weight, character disc weight, and CTA shadow on the homepage.
- [ ] Style the review entry as a slim secondary action and open more vertical breathing room before the search panel.
- [ ] Keep reduced-motion behavior inherited from existing global rules.

### Task 4: Verification

**Files:**
- Verify only.

- [ ] Run the focused homepage test.
- [ ] Inspect `/` locally in the in-app browser.
- [ ] Run `npm run lint`.
- [ ] Run `npx vitest run --pool forks --maxWorkers=1`.
- [ ] Run `npm run build`.
