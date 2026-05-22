# Lightweight Home Design

## Goal

Make the home page feel like a light storybook cover that starts today's card instead of a dense feature dashboard.

## Design

The first screen keeps one dominant object: the daily Hanzi card. It retains the daily character, a short story invitation, and one primary CTA. Repeated helper copy and chip-like mission badges are removed so the family reads the page in one glance.

Review and search stay available without competing with the daily cover. Review becomes a slim leaf action under the main card that still exposes today's collected-leaf count. Search remains a parent-led panel lower in the stack for intentionally opening another Hanzi card.

## Interaction

Existing navigation behavior remains unchanged: the daily CTA opens the daily card, the review action opens `/review`, and the search form keeps cached and generated-card flows. Existing loading and error feedback remain attached to the search form.

## Testing

Home tests should cover the lighter hierarchy by checking that the old mission badges are gone, the review entry is now lightweight, and the daily, review, and search flows still navigate as before.
