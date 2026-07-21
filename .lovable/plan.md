## Change

In `src/routes/index.tsx`, the gallery card header currently shows `B={result.b_value}` (top-right of each scattered card). Replace it with the submission date formatted as `DD/MM`, derived from `result.created_at`.

- Format: two-digit day, slash, two-digit month (e.g. `21/07`). No year, no time.
- Keep the same JetBrains Mono styling, font size, letter-spacing, and opacity so the visual weight is identical.
- No changes to the result screen (it doesn't display B), the database, the analysis prompt, or any other UI.

### Technical detail

Around line 1197, swap:

```tsx
B={result.b_value}
```

for a small inline formatter reading `result.created_at` (already selected in the gallery query) and rendering `dd/MM`. Guard against a missing/invalid date by falling back to an empty string.
