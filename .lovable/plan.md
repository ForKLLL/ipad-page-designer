## Goal
Insert a new "mood check-in" step right after the intro screen where the participant picks one of the 11 grey-scale swatches (rendered as squares, not circles) that best matches their current inner state. It is decorative only — it does NOT affect the AI result or the stored `b_value`.

## Flow change
Current: `intro → question (Q1..Q10) → free (Q11) → loading → result → gallery`
New:     `intro → **mood** → question → free → loading → result → gallery`

## UI (new `MoodScreen`)
Layout mirrors the uploaded reference (Artboard_15.jpg):
- Heading (top, Noto Serif TC / serif equivalent for EN)
  - ZH: `開始前，請選擇你現在的內心狀態更接近的顏色（不影響結果）`
  - EN: `Before we begin, pick the shade closest to your current inner state (this does not affect your result).`
- 11 swatches laid out in the same T-shape as the reference: top row of 5 (darkest → mid), single centered swatch in the middle, bottom row of 5 (mid → white). Order = the 11 canonical hex codes (#000000 → #FFFFFF).
- Swatches are **squares** (rounded-none), tap-target ~clamp(64px, 9vw, 110px), with a subtle ring/scale on hover and a solid inked border when selected.
- `BalancE` wordmark bottom-right (reuse existing bold logo styling).
- Bottom-left `LangToggle` stays as-is (top-right on other screens; keep consistent — top-right here too).
- After a swatch is tapped: brief 250ms confirm state, then auto-advance to the first question. Also a `繼續 / Continue` text button appears as a fallback.

## State & data
- Add `stage: "mood"` to the union and route `intro`'s Begin button to `mood` instead of `question`.
- Add `moodHex: string | null` to component state. Store selection in memory only.
- Do NOT send `moodHex` to `analyzeBalance`; do NOT persist it to `results`. No schema change, no server change.

## i18n
Add ZH/EN strings for the heading, the continue button, and (optional) an aria-label per swatch using the existing shade name map already used on the result screen.

## Files touched
- `src/routes/index.tsx` — new `MoodScreen` component, new stage in the state machine, EN/ZH copy, wire intro → mood → question.

## Out of scope
- No changes to `src/lib/analyze.functions.ts`, questions, tiers, gallery, DB, or RLS.
- No new asset uploads; swatches are pure CSS squares using the 11 hex codes.
