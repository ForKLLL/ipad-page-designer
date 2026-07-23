## Goal
Remove the pre-snapped Hex anchor from the model's input so it no longer gravitates toward a specific swatch. Replace it with a coarse direction label plus the raw picked-B distribution, and label each B tier with its color name so the model reasons in color language rather than pattern-matching a single suggested hex.

## Changes (all in `src/lib/analyze.functions.ts`)

### 1. Stop pre-snapping the anchor to a Hex
In `buildUserPrompt`, drop the line that computes `snapped` and prints `就近十位對應 Hex：${snappedToHex(snapped)}`. The combined anchor stays as a raw number (0–100), but no hex is suggested.

### 2. Add a direction bucket instead of a hex
Derive a coarse label from `combinedAvgB`:
- `0–29` → "偏暗 / darker"
- `30–49` → "偏暗中性 / balanced-dark"
- `50` → "中性 / balanced"
- `51–70` → "偏亮中性 / balanced-light"
- `71–100` → "偏亮 / lighter"

Print this direction in place of the hex, wording it as a *tendency*, not a target.

### 3. Show the raw B distribution
For each answered question, already prints `B≈X`. Add a compact summary line listing all picked B values (e.g. `[10, 67, 42, 92, 42, 67, 10, 42, 67, 92]`), plus min / max / spread so the model can see variance and outliers rather than just the mean.

### 4. Name the colors inline with each B tier
When printing each question's pick and when describing the anchor, append the color name for that B decile. Names come from the existing guide:
```
0 Black · 10 Extreme Dark Grey · 20 Dark Grey · 30 Deep Grey ·
40 Medium Grey · 50 Standard Grey · 60 Medium Light Grey ·
70 Light Grey · 80 Bright Grey · 90 Extreme Light Grey · 100 White
```
So a pick prints as `→ 選擇：… (B≈40, Medium Grey)` and the anchor prints as `方向：balanced-dark（picked average B≈42, near Medium Grey）— 僅為傾向參考，非目標`.

### 5. Tighten the accompanying prompt sentence
Replace the current "此為參考起點…最終 Hex 必須是 11 色調色盤中的其中一個" sentence with wording that:
- States the direction + raw distribution are context, not a target,
- Explicitly says no specific hex is being suggested,
- Repeats that the final Hex must be one of the 11 palette values.

### 6. Keep `snappedToHex` in the file
Still used elsewhere/imports; just no longer called from `buildUserPrompt`. (If unused after the edit, remove it.)

## Out of scope
- No changes to `SYSTEM_PROMPT` guide content, question tiers, free-text classifier, UI, or scoring in `src/routes/index.tsx`.
- English/Chinese output behavior unchanged.
