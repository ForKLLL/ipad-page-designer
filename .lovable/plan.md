## Goal

On desktop (PC) only, give the gallery more space between cards and larger text. iPad and mobile layout stay identical.

## Approach

Keep all gallery layout constants (`CARD_W/H`, `GAP_X/Y`, `SLOT_POSITIONS`, `SCREEN_W/H`, logo box) unchanged so iPad still fits perfectly. Apply a CSS `transform: scale()` to the gallery scroller on wide viewports — this proportionally increases card size, gaps between cards, and every text element inside cards in a single move.

## Change (in `src/routes/index.tsx`, gallery scroller wrapper only)

1. Add a `useMediaQuery`-style effect (or a simple `window.matchMedia('(min-width: 1280px)')` hook) inside `GalleryScreen` that returns `isDesktop`.
2. Wrap the inner scroller in a container that, when `isDesktop`, applies:
   - `transform: scale(1.25)`
   - `transformOrigin: 'center top'`
   - reserves the scaled footprint via `width: SCREEN_W * 1.25`, `height: SCREEN_H * 1.25` on the outer wrapper so surrounding layout (header, footer count line) doesn't collide.
3. Leave the `maxWidth: SCREEN_W` on the scroller for iPad/mobile — the desktop branch overrides with the scaled size.
4. No changes to card component internals, text sizes, or slot math.

## Result

Desktop: cards ~25% larger, gaps ~25% wider, all text (shade name, date, hex, analysis) ~25% larger — a single uniform upscale.
iPad / mobile: unchanged.