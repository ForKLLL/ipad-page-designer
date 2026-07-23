## Gallery: max 4 cards visible, random horizontal placement

Update `GalleryScreen` in `src/routes/index.tsx`:

1. **Change visible slot count from 8 → 4.**
2. **Replace the 3-row `SLOT_POSITIONS` grid with a single-row layout.**
   - All 4 visible cards sit on one horizontal row, vertically roughly centered relative to the current strip height.
   - X positions: divide the canvas width into 4 zones; within each zone, apply deterministic random jitter (seeded per slot index or per card id so it feels random but doesn't reshuffle on every render).
   - Y positions: small random jitter (e.g. ±20–30px) around the row baseline.
3. **History lane behavior unchanged:** cards beyond the newest 4 slide left off-screen into the scroll-left history area, using the same push mechanic that currently handles overflow past 8.
4. **Keep everything else intact:** card size, fonts, desktop 1.25× scale, top padding alignment with the wordmark, real-time subscription, falling animation on new arrivals.

### Technical notes
- Rewrite `SLOT_POSITIONS` as a function that returns 4 `{x, y}` slots based on canvas width and a seeded RNG (seed by slot index so layout is stable across renders).
- Recompute the visible-strip width so the 4 zones span the iPad viewport; adjust the history-lane offset math (currently based on 8 slots) to use 4.
- No changes to DB, RLS, scoring, or admin moderation.
