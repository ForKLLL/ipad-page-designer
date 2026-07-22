## Goal

The gallery always shows exactly **8 cards on screen at once**, arranged around the logo. New submissions replace the oldest on-screen card in that fixed 8-slot arrangement; the displaced older card is pushed off-screen to the left, where the user can only see it by scrolling left themselves. Snap-to-newest on realtime insert.

## The fixed 8-slot on-screen arrangement

Three-row visible viewport, hugging the logo:

```text
   ┌────┬────┬────┬────┐
   │ 1  │ 2  │ 3  │ 4  │   top row: 4 cards
   ├────┴──┬─┴────┼────┤
   │   5   │      │ 6  │   middle row: 2 cards, one on each side of the logo
   ├───────┴──────┼────┤
   │ 7  │ 8  │ 9  │ 10 │   (see below — actually 4 + 2 + 4 = 10?)
   └────┴────┴────┴────┘
```

Correction to match the 8 you asked for: **top 4 + middle 2 (flanking the logo) + bottom 4 = 10**, not 8. The plan uses:

```text
   ┌────┬────┬────┬────┐
   │ A  │ B  │ C  │ D  │   top row: 4
   │    │    │    │    │
   ├────┼────┴────┼────┤
   │ E  │  LOGO   │ F  │   middle row: 2 (one each side of the logo)
   ├────┼────┬────┼────┤
   │ G  │ H  │    │    │   bottom row: 2  ← trimmed so total = 8
   └────┴────┴────┴────┘
```

Please confirm which shape you want (see question in header). For the plan I'll assume **top 4 + middle 2 + bottom 2 = 8**, mirrored so it looks balanced (bottom two centered under the logo). If you actually want 10 visible, I'll expand it — one word from you.

## Placement rules

- The **first 8 submissions ever** get randomly shuffled into the 8 slots (deterministic per-id jitter/rotation stays, but slot assignment is randomized once and then fixed).
- From submission 9 onward: the newest card takes the slot currently held by the **oldest of the 8 on-screen cards**. The displaced card moves off-screen to the immediate left, joining the horizontal history strip.
- Slot identity is stable — a slot is a physical position on screen; only the *card* in it changes. This preserves the composed look.
- Off-screen history extends leftward in insertion order (oldest furthest left). Same card size + gaps as on-screen, laid out in a single row (or two rows mirroring top+bottom) — see question.

## Scroll behavior

- Container is horizontally scrollable. On mount and on every realtime INSERT, snap scroll to the right edge so the 8 on-screen slots are framed.
- No "respect user scroll position" logic — always snap right, per your answer.

## Logo

Fixed, centered behind the visible viewport (not inside the scrolling strip). It stays put while cards scroll past on the left.

## Realtime replacement animation

- Incoming card uses the existing `cardFall` drop-in animation into its new slot.
- Displaced card slides left out of the viewport into the history strip (short translate + fade).

## Files touched

- `src/routes/index.tsx` only
  - Replace `computePlacements` with a fixed-slot model: 8 named on-screen slots + a leftward history lane.
  - `GalleryScreen`: maintain `onScreen: (SavedResult|null)[]` (length 8) + `history: SavedResult[]`; on INSERT, evict the oldest on-screen entry into history and place the new one in that slot.
  - Wrap in horizontal scroll container; add scroll-to-right effect on mount + on new insert.
  - Keep header, logo, styling, colors, fonts unchanged.

No backend/schema changes.
