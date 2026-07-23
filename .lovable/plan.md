## Plan

Animate the center "balance" wordmark in the gallery so its black fill flows like waves (matching the loading-page fluid feel), instead of sitting static.

### What changes

1. **Gallery center logo only** — the wordmark rendered in the middle of the gallery scroller (currently `SplitWaveLogo` / static "balance" text). Cards, layout, spacing, and every other screen stay untouched.

2. **Wave motion**
   - Replace the static black fill with an animated wavy clip: the black portion of each letter rises/falls horizontally across the wordmark on a slow loop (~5–7s), so the "blackness" appears to slosh like liquid.
   - Use pure SVG + CSS (SMIL / CSS keyframes on an SVG `<path>` clip or `feTurbulence` + `feDisplacementMap` animation). No new deps.
   - Two overlaid wave paths at slightly different speeds/phases so the surface looks organic rather than a single sine.

3. **Style guardrails**
   - Strictly black on `#f2efee` — no colors, no glow.
   - Respect `prefers-reduced-motion`: fall back to the current static logo.
   - Animation runs only in the gallery stage (not intro / loading / result).

### Technical notes

- Edit only `src/routes/index.tsx` (the `GalleryScreen` center-logo block, and the `SplitWaveLogo` component or a new `FluidBalanceLogo` beside it).
- Implementation approach: SVG `<text>` as the shape, a `<clipPath>` containing two animated `<path>` wave shapes whose `d` attribute animates via `<animate>` (SMIL) — cheap, GPU-friendly, no JS tick.
- No changes to scoring, data, RLS, i18n, card sizes, or slot math.
