## Goal
Make Q11 (the open-ended question) a first-class signal in the analysis, not a minor tiebreaker. It should meaningfully shift the result when the free text contradicts or nuances the multiple-choice pattern — because that's exactly when a person "doesn't fit" the 11 scales.

## Why this needs changing
Right now in `src/lib/analyze.functions.ts`:
- The combined anchor is `(choiceAvgB * 2 + freeTextB) / 3` — Q11 is worth **half** of the choice average.
- The prompt frames Q11 as just "Q11 (open question)" at the bottom, with no instruction that it can override the choice pattern.
- The system prompt mentions Q11 imagery in passing but never says "when Q11 diverges from the choices, trust Q11 more, because the choices are a forced 4-option grid and Q11 is the person's own words."

Net effect: mixed choices + a strong Q11 image still collapse toward the choice average.

## Changes (all in `src/lib/analyze.functions.ts`, prompt-only)

### 1. Rebalance the anchor weighting
Change the combined anchor from `2:1` (choice:free) to roughly `1:1`, and when the choice answers are high-variance (spread ≥ 40), tilt it further toward Q11 (e.g. `1:2`). Rationale: high spread = the person didn't fit the grid, so their own words should lead.

### 2. Elevate Q11 in the user prompt
- Move Q11 up so it's presented alongside the choice summary, not as a trailing footnote.
- Label it explicitly as "使用者自己的話 / the user's own words" and note it is unconstrained by the 4-option grid.
- Print the free-text B estimate + color name next to it, and flag when it diverges from the choice average (e.g. `|freeTextB - choiceAvgB| ≥ 20` → "Q11 與選擇題方向不一致，請以 Q11 為主要依據").

### 3. Update the system prompt guidance on Q11
Add one short paragraph in the 【Input 數據處理邏輯】 section:
- Choices are a forced 4-option grid and may not fit the person; Q11 is their own language and carries equal or greater weight.
- When Q11 clearly contradicts the choice pattern, follow Q11.
- When Q11 nuances the choices (same direction, different texture), let it refine the final Hex within that direction.

### 4. Keep everything else intact
- No changes to `SYSTEM_PROMPT` color guide, question tiers, UI, scoring in `src/routes/index.tsx`, or the 11-hex palette lock.
- `classifyFreeTextB` and the direction-label logic stay as-is.

## Out of scope
- Changing the questionnaire itself or the tier values.
- Changing the free-text classifier model or its 0–100 snapping.
- Any UI or gallery changes.
