## Goal
Make `#808080` (Standard Grey, B=50) unreachable so results always land on one of the other 10 shades. Rationale: the exact psychological middle is implausible; forcing a lean (dark or light) produces more honest readings.

## Changes (all in `src/lib/analyze.functions.ts`, no UI/questionnaire edits)

### 1. Remove #808080 from the allowed palette
- Delete `#808080` from `HEX_TO_B`, `snappedToHex`, and both palette-lock lines in `SYSTEM_PROMPT` (the intro rule and the "最終提醒 · 調色盤鎖定" footer). The allowed set becomes 10 hexes: `#000000, #1A1A1A, #333333, #4D4D4D, #666666, #999999, #B3B3B3, #CCCCCC, #E6E6E6, #FFFFFF`.
- Do the same in the English `langDirective` mapping list.
- Remove the `#808080` entry from the color-guide section of `SYSTEM_PROMPT` entirely (so the model has no description to anchor to).

### 2. Add an explicit "no exact middle" rule to the system prompt
Add one line in 【Input 數據處理邏輯】: 人的內在狀態幾乎不會落在絕對正中，因此 `#808080` 不在可選調色盤中；當整體圖像看似中性時，請根據 Q11 語感與答案分佈的細微傾向，果斷選擇 `#666666`（偏暗中性）或 `#999999`（偏亮中性），不要停在中點。

### 3. Nudge the direction label and anchor away from 50
- In `directionLabel`, remove the `b === 50` "中性 / balanced" branch; collapse it into `balanced-dark` (≤50) vs `balanced-light` (>50, ≤70).
- In `buildUserPrompt`, when `combinedAvgB === 50`, bump it to `40` or `60` based on which side Q11's `freeTextB` leans (default to `40` if Q11 is unavailable or also exactly 50 — matches the more common introspective lean; noted in the plan so it's a conscious tiebreaker, not silent).

### 4. Fallback snapping never returns 50
- In the RGB-average fallback inside `analyzeBalance` and in `classifyFreeTextB`'s snap, if a computed value snaps to 50, push it to 40 (dark tiebreak) or 60 based on the raw value's sub-decile remainder (≥5 → 60, else 40). This guarantees no code path silently produces `#808080` even if the model ignores the rule.

### 5. Existing results are unaffected
No migration; historic gallery cards showing #808080 stay as-is. Only new analyses are constrained.

## Out of scope
- Question tier values, UI, gallery layout, Q11 weighting logic (kept from the previous plan).
- Removing any other shade.
