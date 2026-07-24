## What's happening

The gallery cards already show the participant's Q11 free-text as an italic quote above the analysis. But the personal **result page** (shown right after they finish the test) only renders the AI analysis — the typed-in answer is never displayed back to them there. That's the gap.

## Change

In `src/routes/index.tsx`, update `ResultScreen` to also receive and render the free-text answer as an italic quote, matching the gallery card treatment.

1. Pass `freeText` into `ResultScreen` from the parent (`stage.kind === "result"` render site).
2. In `ResultScreen`, if `freeText` is non-empty, render it above the first analysis paragraph as an italic quoted line using `Noto Serif TC`, muted ink color, wrapped in curly quotes — same style as `ScatteredCard` in the gallery.
3. No changes to scoring, database, or gallery.

Nothing else changes.
