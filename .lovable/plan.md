## Goal

Make the gallery denser (more cards visible without scrolling) and show each card's **full** analysis instead of a 220-char snippet.

## Changes (all in `src/routes/index.tsx`, gallery section only)

1. **Shrink each card** so more fit per row:
   - `CARD_W`: 210 → 150
   - `CARD_H`: 290 → 210 (auto-adjusts if text needs slightly more, see below)
   - `GAP_X`: 44 → 22
   - `GAP_Y`: 56 → 28
   - Reduce swatch (46→34), header font sizes (14→11 title, 8→7 B=), and internal padding proportionally.

2. **Show full analysis** on each card:
   - Remove the `.slice(0, 220)` snippet and the `…` truncation.
   - Render the entire `result.analysis` in the card body.
   - Set body font to ~6.5px with tight line-height (1.45) so a full ~230字 result fits.
   - Because text length varies per card, switch card height from a fixed `CARD_H` to a **content-driven** height with a `min-h` — placement grid still uses `CARD_H` as the row unit so layout stays predictable, and slight text overflow inside a card is allowed (cards are rotated/scattered so uneven bottoms look natural, matching the reference).
   - Drop the truncating `overflow-hidden` on the paragraph.

3. **Reduce jitter and rotation** slightly (jitter 26→14, rot ±18 → ±10) so tighter cards don't visually collide.

4. Keep the logo zone, fall-in animation, realtime insertions, and all other behavior unchanged.

No backend, schema, or analysis-prompt changes.

## Result

On a 1273px viewport the gallery goes from ~4 columns of tall cards to ~6–7 columns of compact cards, each displaying the complete analysis text — significantly more balances visible before scrolling.
