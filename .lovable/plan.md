## Problem

Right now Q11 can single-handedly flip the result. Two things cause this:

1. **Weighting math in `src/lib/analyze.functions.ts`**
   - Default blend is `choice : freeText = 1 : 1` (Q11 already equals the average of 10 choice answers).
   - When choice spread ≥ 40, it becomes `1 : 2` — Q11 dominates.
   - When Q11 diverges from choices by ≥ 20, we mark it with a ⚠ line telling the model to treat Q11 as the **primary** driver.

2. **Prompt language** in the same file reinforces this:
   - "Q11 至少與選擇題整體等重"
   - "當 Q11 與選擇題方向明顯不一致，請以 Q11 為主要依據，選擇題僅作為輔助紋理"

Combined, typing "white" after picking mostly dark options produces white.

## Change

Only touch `src/lib/analyze.functions.ts`. Goal: Q11 is a nudge, not a veto.

1. **Reweight the blend** to roughly `choice : freeText ≈ 4 : 1` in the combined average:
   - Default: `combinedAvgB = round((choiceAvgB * 4 + freeTextB) / 5)`
   - High-spread branch: soften to `choice : freeText = 3 : 1` (still gives Q11 a bit more room when the choices are scattered, but never lets it dominate).
   - If Q11 is missing, unchanged.
   - Update `weightNote` strings to reflect the new ratios.

2. **Rewrite Q11 guidance in `SYSTEM_PROMPT`** so the model treats Q11 as a tiebreaker / texture, not an override:
   - Replace "Q11 至少與選擇題整體等重" with wording like: "Q11 是輔助線索，用來在選擇題確立的方向內做細部微調；權重明顯低於 10 道選擇題的整體。"
   - Replace the "以 Q11 為主要依據" clause with: "當 Q11 與選擇題方向明顯不一致，仍以選擇題整體為主，Q11 只用來在該方向內選擇偏亮或偏暗的鄰近色；不得因單一 Q11 的極端意象（例如純白或純黑）就跳到光譜另一端。"
   - Add an explicit anti-extreme rule: "若選擇題整體明顯偏暗（或偏亮），最終 Hex 不得跳到相反端點；最多往 Q11 方向移動 1–2 個色階。"

3. **Soften the ⚠ divergence note** built in `buildUserPrompt` to match: it should say Q11 diverges and suggest a small nudge in Q11's direction, not a takeover.

4. Keep the midpoint exclusion (`#808080`) and the 10-color palette exactly as-is. No changes to UI, DB, gallery, or scoring outside this file.

## Technical details

- File: `src/lib/analyze.functions.ts`
  - `buildUserPrompt`: adjust the two branches computing `combinedAvgB` and their `weightNote`; rewrite the `divergence` message.
  - `SYSTEM_PROMPT`: edit the two Q11 clauses inside 【Input 數據處理邏輯】 and add the anti-extreme sentence.
- No schema, no route, no component changes.

## Expected effect

- Mostly-dark answers + "white" Q11 → result stays dark, maybe one step lighter (e.g. `#333333` → `#4D4D4D` or `#666666`), never `#FFFFFF`.
- Consistent answers → essentially unchanged.
- Scattered choices + strong Q11 → Q11 gets a bit more pull, but still can't jump to the opposite end.
