## Problem

The gallery's top row is being clipped. Cards in row 1 are placed at `y = EDGE_PAD - 150` (negative), but the scroller uses `height: SCREEN_H` with `overflowY: hidden` — anything above y=0 gets cut off. That's why the top row's full result card isn't visible.

The lift-only approach can't work: the scroller has a fixed height that doesn't account for the raised row.

## Fix

In `src/routes/index.tsx`, stop lifting the top row and instead anchor the whole gallery strip from the top of the viewport so row 1 naturally sits at the same height as the intro "BalancE" wordmark.

1. Set `TOP_ROW_LIFT = 0` so all three rows use their normal `EDGE_PAD`-based `y` positions (top row fully inside the canvas, no clipping).
2. Change the outer scroller wrapper (line 1263) from `items-center` (vertical center) to `items-start` with a top padding equal to the intro logo's offset (~56 px, matching the homepage header padding). This raises the entire 3-row grid so row 1 aligns with the "BalancE" wordmark height, while rows 2–3 and the centered logo shift up together — preserving the existing spatial relationships.
3. Leave `SCREEN_W`, `SCREEN_H`, `SLOT_POSITIONS` math, card sizes, history lane, and logo box otherwise unchanged.

Result: same visual placement of the top row (aligned with the homepage wordmark), but the full card is now inside the visible/scrollable area instead of being clipped.