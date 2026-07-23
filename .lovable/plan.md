## Goal
Raise the gallery's top row of cards so their top edge sits at roughly the same height as the "BalancE" wordmark on the intro/homepage. Middle row, bottom row, centered logo, and history lanes stay where they are.

## Where things sit today
- Intro (`Intro` in `src/routes/index.tsx`): the page uses `py-14` (56px top padding) and the `BalancE` `<h1>` sits at the very top of that flex row, so its top edge is ~56px from the top of the viewport.
- Gallery (`GalleryScreen` in `src/routes/index.tsx`):
  - Top bar takes ~72px.
  - The scroller (`SCREEN_H = 688px`) is vertically centered inside the remaining strip via `items-center`.
  - Top-row slots are placed at `y = EDGE_PAD - TOP_ROW_LIFT = 20 − 40 = −20` inside the scroller.
  - On a ~944px-tall viewport that puts the top card edge ~164px from the viewport top — well below the intro logo.

## Change
In `src/routes/index.tsx`, only touch the top-row Y in `SLOT_POSITIONS`:

1. Bump `TOP_ROW_LIFT` from `40` to about `150` so the top four slots move up ~110px more, landing near the ~56px viewport line that the intro `BalancE` uses.
2. Leave `EDGE_PAD`, `GAP_Y`, `SCREEN_H`, `LOGO_BOX`, `HISTORY_TOP_Y`, `HISTORY_BOT_Y`, and the middle/bottom rows unchanged.
3. Do not change the scroller's `items-center` alignment or any card sizes — this keeps the middle row, logo, bottom row, and history lanes visually identical.

No other files or logic change.

## Follow-up check
Reload the gallery in the preview (iPad viewport) and confirm the top row of cards visually aligns with where "BalancE" sits on the intro page, while rows 2/3 and the centered logo look unchanged.
