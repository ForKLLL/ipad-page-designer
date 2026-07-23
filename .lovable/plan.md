## Goal
Move the top row of gallery cards higher on the screen.

## Current state
- Gallery constants live in `src/routes/index.tsx` around line 1031.
- `EDGE_PAD = 20` controls the top padding for the top row.
- `SCREEN_H` and all slot Y positions are derived from `EDGE_PAD`.

## Plan
1. Introduce a dedicated `TOP_PAD` constant (smaller than current `EDGE_PAD`, e.g. 8–12 px) so only the top-row vertical origin changes.
2. Keep `GAP_Y` unchanged so spacing between rows stays consistent.
3. Recompute `SCREEN_H` and `SLOT_POSITIONS` Y values using the new `TOP_PAD`.
4. Update `LOGO_BOX` and `HISTORY_*` Y values if they depend on the top origin.
5. Verify in the preview that the top row sits higher and the 8-card + centered-logo layout still fits cleanly on iPad and desktop.

## File to change
- `src/routes/index.tsx` (gallery constants and slot positions only).