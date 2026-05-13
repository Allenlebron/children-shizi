# Forest Storybook Style Spec

## Goal

Make the MVP feel more inviting for young children while keeping the parent-led reading flow calm, legible, and trustworthy.

## Selected Direction

Use **A. 森林探险绘本** as the primary visual language.

## Visual Principles

- The app should feel like opening a soft picture book, not a noisy game screen.
- Use a sunny forest palette: fresh green, sky mint, warm cream, honey yellow, and soft orange.
- Keep large readable Chinese characters as the visual anchor.
- Use small decorative motifs such as clouds, leaves, stars, badges, and footprint-like progress.
- Make buttons rounder, bigger, and more tactile so children want to tap them.
- Add reward language lightly, such as stars, leaves, and exploration, without turning the MVP into a full game.
- Add gentle motion: page entry, soft floating clouds/leaves, leaf progress pop, button press feedback, and card shelf reveal.
- Respect reduced-motion settings so animation never becomes a barrier.

## Page Direction

- Home: present the daily card as a forest mission with friendly stickers and a more playful search panel.
- Reading page: make each reading step feel like a storybook page with a scene panel, leafy progress, and soft navigation.
- Character page: add a stroke-order animation card for supported characters; unsupported generated characters should show a calm fallback instead of blocking reading.
- Library: turn the plain list into a small forest card shelf.
- Profile: make progress feel like a collection board with learned cards and favorites.
- Bottom navigation: use a floating leaf-path style, clearer active states, and warmer tap targets.

## Out Of Scope

- No new illustration assets yet.
- No achievement system, login, or backend progress sync yet.
- No audio or generation behavior changes.
- No routing or data model changes.
- No full hanzi stroke-order database yet; the MVP uses a small local data registry for common validation characters and can grow per curated card.
