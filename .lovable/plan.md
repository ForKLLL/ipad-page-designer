## Problem

Gallery cards render at `minHeight: CARD_H = 200px`, but the analysis body (now 10px Noto Serif TC, ~200 Chinese chars in a ~220px-wide column ≈ 9 lines / ~130px) plus header (~40px), divider, and footer row (~50px) needs ~260–300px. The card grows past 200px via `minHeight`, but the containing scroller is fixed at `SCREEN_H = CARD_H + 2·Y_JITTER = 256px` with `overflow: hidden`, and the outer wrapper also clips. Result: cards get cut off mid-body.

## Fix (frontend-only, GalleryScreen constants in `src/routes/index.tsx` ~lines 1031–1055)

1. Increase `CARD_H` from `200` → `300` so the analysis + header + footer fit without overflow.
2. Reduce `Y_JITTER` from `28` → `18` so the taller card row still fits comfortably on iPad height without pushing the strip off-screen (SCREEN_H becomes `EDGE_PAD*2 + 300 + 36 = 376`, vs current 256).
3. Switch the card's `minHeight: CARD_H` to `height: CARD_H` (line ~1356) so every card is exactly the reserved height — no overflow past the scroller, uniform look.
4. No changes to scoring, data, layout math (slotPosition still derives from CARD_H/ZONE constants), desktop `SCALE` wrapper (auto-recomputes from SCREEN_W/H), or card internal styling/fonts.

## Verification

- Open `/` → tap the gallery zone; confirm all 4 cards show full analysis text with the footer (logo + No.) visible, on both iPad viewport and desktop (scaled) viewport.
- Confirm the top row still aligns roughly with the intro wordmark (paddingTop: 56 stays).