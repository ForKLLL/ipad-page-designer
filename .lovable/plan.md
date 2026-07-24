## Goal
On the shared gallery cards, display the participant’s Q11 free-text answer as the first row of the analysis block, in italic style. The AI-generated analysis follows directly underneath.

## Changes

### 1. Fetch `free_text` for gallery cards
- Update the `SavedResult` type in `src/routes/index.tsx` to include `free_text?: string | null`.
- Add `free_text` to the Supabase `select(...)` in the gallery initial-load query.
- Realtime INSERT payloads already carry the full inserted row, so new cards will include `free_text` without extra changes.

### 2. Render Q11 answer as the italic first row
- In the `ScatteredCard` component, render `result.free_text` above `result.analysis` when it exists.
- Style it with `fontStyle: "italic"`, a slightly muted opacity, and a small bottom margin so it reads as the user’s own quote.
- If `free_text` is empty/null, skip the row and show only the analysis (no layout gaps).

### 3. Preserve existing behavior
- The personal result screen stays unchanged.
- No prompt, scoring, or database schema changes.

## Verification
- Submit a test answer with Q11 text filled in.
- Open the gallery and confirm the card shows the Q11 answer in italics at the top of the analysis block, followed by the AI analysis.
- Submit a test with Q11 empty and confirm the card still displays only the analysis.