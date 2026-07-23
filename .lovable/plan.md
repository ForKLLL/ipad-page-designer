## Goal
Make the gallery cards larger so they use the available iPad viewport more efficiently, while still displaying the full analysis and keeping the 8-card + centered-logo layout intact.

## Current state (verified from `src/routes/index.tsx`)
- Gallery cards are `CARD_W = 190` × `CARD_H = 160` px.
- 8 fixed slots arranged around a centered `SplitWaveLogo`.
- Analysis text is rendered at 6 px font size.
- Color swatch is 28 × 28 px.
- The visible screen area is computed from card/gap/edge constants and rendered inside a horizontally-scrolling strip.

## Proposed changes
1. **Increase card size**
   - Raise `CARD_W` from 190 → 240 px.
   - Raise `CARD_H` from 160 → 200 px.
2. **Recompute layout canvas**
   - Update `SCREEN_W`, `SCREEN_H`, `LOGO_BOX`, `HISTORY_TOP_Y`, `HISTORY_BOT_Y`, and `SLOT_POSITIONS` using the new card/gap constants so the 8 slots and logo remain aligned.
3. **Scale typography and inner spacing proportionally**
   - Color swatch: 28 → 36 px.
   - Shade name: 10 → 13 px.
   - Date / hex / mono labels: 5.5 → 7 px.
   - Analysis body: 6 → 8 px, line-height 1.35 → 1.45 for readability.
   - Bottom logo: 38 → 48 px.
   - Divider and padding scaled slightly so the card still feels balanced.
4. **Keep behavior unchanged**
   - Still shows newest 8 results on screen; older results flow into the left history lane.
   - Still displays full analysis text (no truncation).
   - Real-time subscription, fall animation, and rotation/jitter remain the same.

## Files touched
- `src/routes/index.tsx` — update the gallery constants and `ScatteredCard` inner sizes.

## Out of scope
- No changes to the result analysis, questions, AI prompt, DB, or RLS.
- No changes to the number of on-screen cards (still 8) or the horizontal-scroll history behavior.