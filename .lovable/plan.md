## Fix gallery: whole left card + newest-lands-right in order

### Problem
1. At iPad width (~1139px) the 4-slot strip is ~1216px wide, so the auto scroll-to-right hides the left edge of the leftmost card. Screenshot confirms card 1 is clipped.
2. New submissions currently fill the first empty slot (leftmost) and, when full, replace the oldest slot in place. The user wants the newest card to always land in the rightmost slot, with earlier cards shifting left in order.

### Changes — `src/routes/index.tsx` only

1. **Show the whole left card**
   - Shrink the strip so all 4 cards fit inside the iPad viewport (~1100px usable):
     - `GAP_X`: 72 → 32
     - `EDGE_PAD`: 20 → 12
     - Result: `SCREEN_W = 24 + 4*240 + 3*32 = 1080` (fits ≤1100, no horizontal scroll on iPad).
   - Desktop scale (≥1280px) already up-scales by 1.25, so cards remain large on PC.
   - Regenerate `SLOT_POSITIONS` with the new spacing; keep the seeded X/Y jitter.

2. **Newest lands on the right, in order**
   - Initial load: place the 4 newest rows (already fetched desc) so that `slots[3]` = newest, `slots[2]` = next, `slots[1]`, `slots[0]` = oldest of the 4. History (older) stays to the left as today.
   - Realtime INSERT handler: shift the array left — `displaced = slots[0]`; `slots = [slots[1], slots[2], slots[3], newRow]`. If any slot is still `null` (fewer than 4 landed), shift only from the first non-null so empties stay on the left and the new card takes slot 3.
   - Push `displaced` (if any) to the front of `history` as today, so it slides into the off-screen history lane to the left.
   - Keep the fall animation + `newIds` highlight for the incoming card.

3. **Keep everything else untouched**
   - Card dimensions (240×540), fonts, jitter feel, logo, history lane math, real-time subscription, scoring, RLS, i18n — all unchanged.
   - Auto-scroll-to-right stays (only matters once history exists).

### Verification
- Load gallery at 1139×944: all 4 cards fully visible, no clipping.
- Simulate an insert: newest card falls into the rightmost slot; each prior card moves one slot left; the previous leftmost card slides into the history lane.
