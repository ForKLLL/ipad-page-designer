## Goal
Let the model weigh the **whole pattern** of answers (choice + free text, including outliers and tension) instead of being rail-locked to the weighted average. Output must still be exactly one of the 11 approved hex codes.

## Approach
Keep all inputs the model already sees, but demote the combined anchor from a hard ±20 constraint to soft guidance, and reinforce the 11-color allowlist so nothing else can be returned.

### Changes in `src/lib/analyze.functions.ts`

1. **System prompt — remove the hard rail, keep the palette lock**
   - Delete the "最終 Hex 的 B 值必須落在此綜合錨點 ±20 以內" clause (and the matching sentence in the English directive).
   - Replace with holistic guidance: treat the combined anchor as a **starting reference, not a ceiling/floor**; weigh every answer as part of a whole; if a bright outlier or a strong Q11 signal genuinely reshapes the pattern, honor it; if answers are bimodal / in tension, name the tension and choose the hex that best represents the overall gestalt.
   - Re-emphasize the palette lock: the final Hex **must** be exactly one of the 11 listed codes (`#000000, #1A1A1A, #333333, #4D4D4D, #666666, #808080, #999999, #B3B3B3, #CCCCCC, #E6E6E6, #FFFFFF`). No other hex is permitted. Repeat this rule at the end of the prompt so it's the last thing the model reads.

2. **User prompt — reframe the anchor line**
   - In `buildUserPrompt`, change the "【綜合錨點】... 最終 Hex 必須落在此錨點 ±20 內" line to describe the anchor as a **reference point** only, and explicitly note the model should feel free to depart from it when the full answer pattern warrants.
   - Keep the per-question B values and the Q11 classified B in the prompt (they're the raw signal the model now weighs itself).

3. **Server-side palette guard (safety net)**
   - After the model returns, keep the existing hex parsing. If the parsed hex is **not** in `HEX_TO_B`, snap to the nearest allowed decile (already partially done via the RGB-average fallback) — reuse `snappedToHex` to guarantee the returned `bValue` maps to one of the 11 codes.
   - No change to the returned `analysis` text; the palette guard only governs `bValue`.

## Out of scope
- No changes to questions, tiers, gallery, UI, or the Q11 classifier itself.
- No change to language directive length caps (300 zh / 200 en).

## Technical notes
- Net effect: the model receives (a) each individual answer's B, (b) Q11's classified B, (c) the weighted anchor as *reference*, and is told to choose the single hex from the 11-color palette that best fits the whole pattern.
- Predictability trade-off is accepted: results may drift further from the numeric average when answers genuinely disagree — that's the point.
