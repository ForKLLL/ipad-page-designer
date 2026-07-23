## What's wrong (from screenshot)

1. **Card overflows its box.** In the last change I switched `minHeight: CARD_H` → `height: CARD_H` (300px). The card itself has `overflow: visible`, so the analysis text keeps flowing past 300px and out of the reserved slot — the card visibly bleeds down past the wordmark row.
2. **Row doesn't use the full width.** `SCREEN_W = 2·20 + 4·240 + 3·20 = 1080` (scaled 1.25 on desktop = 1350) with only one submission in the DB, so the single card sits pinned at the leftmost slot and the whole right side is empty except the centered logo.

## Fix (frontend-only, `src/routes/index.tsx`)

Constants block (~lines 1031–1036):
- `CARD_H`: 300 → **360** (fits a full ~200-char analysis at 10px + header + footer with a small buffer).
- `GAP_X`: 20 → **72** (spreads the 4 slots across the row; new `SCREEN_W = 40 + 960 + 216 = 1216`, which at desktop `SCALE=1.25` = 1520 — fits comfortably in the 1396-wide iPad-scaled canvas with the existing horizontal scroller taking any overflow).
- `Y_JITTER`: 18 → **14** (keeps SCREEN_H reasonable: 40 + 360 + 28 = 428).

Card element (~line 1356):
- Revert `height: CARD_H` → **`minHeight: CARD_H`** so cards grow to fit content instead of clipping/overflowing when the analysis runs long, while still reserving a uniform baseline.

Nothing else changes — `slotPosition`, `SLOT_POSITIONS`, `LOGO_BOX`, scaling wrapper, and card internal styles all derive from these constants.

## Verification

- Reload `/` → tap "peek in first" → confirm on iPad viewport (1396×944):
  - Card renders inside its slot with no text spilling past the bottom edge.
  - Logo remains centered in the screen area.
  - Row visually uses more of the horizontal length (spread across ~1520px scaled canvas).
- Confirm scrolling left still reveals older cards in the history lane.