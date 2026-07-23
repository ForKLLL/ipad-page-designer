## Goal
Let Q11 (open-ended answer) meaningfully influence the final Hex, not just serve as tiebreaker flavor.

## Approach
Treat Q11 as an extra weighted signal folded into the anchor, and widen the allowed shift.

### Changes in `src/lib/analyze.functions.ts`

1. **Free-text B estimation (new pre-step)**
   - Before the main analysis call, run a small classifier prompt to the AI gateway that maps the free-text answer to a B value on the 0–100 scale (snapped to deciles). Returns a single integer.
   - If free-text is empty or classification fails, skip and behave as today.

2. **Weighted anchor**
   - New anchor = round( (choiceAvgB × 2 + freeTextB × 1) / 3 ), snapped to nearest decile.
   - Pass both the choice average and the free-text B to the model in the user prompt, plus the combined anchor.

3. **Wider allowed range**
   - Update `SYSTEM_PROMPT` rule: final Hex must stay within ±20 of the combined anchor (was ±15 of choice average, with ±10 shift only on contradiction).
   - Remove the "only shift on strong contradiction" clause — the free-text weight is now baked into the anchor itself.

4. **English directive** unchanged except mirroring the ±20 wording.

## Out of scope
- No UI changes.
- No changes to questions, tiers, or gallery.

## Technical notes
- The classifier call uses the same `google/gemini-2.5-flash` model with `max_tokens: 10` and a strict "reply with only an integer 0–100" system prompt — cheap and fast.
- Failure of the classifier is non-fatal: falls back to choice-only anchor.
