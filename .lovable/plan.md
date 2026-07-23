## Adjust gallery card proportions

### Goal
Make each gallery card wider and shorter while keeping the existing 8-slot composition, real-time updates, and horizontal history scroll.

### Changes
1. **Card dimensions** in `src/routes/index.tsx`:
   - `CARD_W`: 150 → 200 px
   - `CARD_H`: 210 → 145 px
2. **Recalculate derived layout constants**:
   - `SCREEN_W`, `SCREEN_H`, `SLOT_POSITIONS`, `LOGO_BOX`, `HISTORY_TOP_Y`, `HISTORY_BOT_Y` based on the new width/height.
3. **Refit card content** for the shorter height:
   - Shrink analysis text from `6.5px` to `5.5px` and tighten line-height to `1.35`.
   - Slightly reduce swatch/header spacing so the full analysis still fits without truncation.
4. **Preserve behavior**:
   - 8 fixed on-screen slots around the logo.
   - Newest submission replaces oldest slot; displaced card moves to the left history lane.
   - Scroller snaps right to newest.

### Verification
- Run `tsgo` to confirm no type errors.
- Visually check the gallery preview to ensure cards are landscape, text fits, and the logo remains centered.