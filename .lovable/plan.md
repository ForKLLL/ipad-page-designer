## Symptom

Looking at the 30 most-recent submissions in the database, every result lands in a narrow band of #333333–#B3B3B3, and roughly two-thirds are #666666 (中灰) or #999999 (中淺灰). No submission has reached #1A1A1A/#000000 or #CCCCCC/#E6E6E6/#FFFFFF in recent memory. The scale is collapsing to a "medium-light grey by default" outcome.

## Root cause (confirmed from prompt + tier data)

Two forces push results toward the middle two shades:

1. **Averaging math.** Each question's four options carry B ≈ 5–15 / 40–45 / 60–70 / 85–95. Averaging 10 answers almost always lands in 35–65, so `combinedAvgB` is nearly always labelled `balanced-dark` or `balanced-light`. Extremes require someone to pick the same-side option in almost every question, which rarely happens.
2. **Prompt bias toward the two middle greys.** The system prompt currently says (paraphrasing lines 52 + Mapping guidance): "當整體圖像看似中性時，請根據 Q11 語感與答案分佈的細微傾向，果斷選擇 #666666 或 #999999。" Once the direction label is `balanced-*`, the model reads this as an explicit instruction to pick exactly those two hexes — so it does, almost every time.

Q11 stance weighting, the divergence warning, and the aspiration/rejection scaling all correctly prevent Q11 from flipping the result, but they *also* keep the combined B firmly inside the 40–60 band, which the prompt then snaps to 中灰/中淺灰.

## Change (all in `src/lib/analyze.functions.ts`)

### 1. Stop collapsing "balanced-*" to only two hexes

Rewrite the midpoint clause so the model treats the 4 middle shades (`#4D4D4D`, `#666666`, `#999999`, `#B3B3B3`) as equally valid neutral landing points, and instructs it to use **spread, extremes, and Q11 imagery** — not the average alone — to decide which one:

- Wide spread with dark outliers or dark Q11 imagery → prefer #4D4D4D.
- Wide spread with bright outliers or bright Q11 imagery → prefer #B3B3B3.
- Tight cluster near mid-dark → #666666.
- Tight cluster near mid-light → #999999.

Explicitly forbid "default to #666666/#999999 whenever unsure".

### 2. Report spread + extremes as first-class signals, not just the average

In `buildUserPrompt`, add a `【離群訊號】` line summarising:
- How many answers sit in each quartile of the 0–100 range (e.g. `dark(0-25): 2, mid-dark(26-50): 5, mid-light(51-75): 2, light(76-100): 1`).
- Whether any single question hit an extreme tier (B ≤ 15 or B ≥ 85) and which.
- Q11 raw B and stance, restated next to the distribution so the model reads them together instead of after the average.

Downweight the `【整體傾向】` line: keep it, but explicitly label it as "one of several signals, not the answer".

### 3. Widen the reachable range for lopsided answer patterns

When ≥ 6 of 10 choice answers sit in the same outer tier (B ≤ 25 or B ≥ 75), append a directive to the prompt: "圖像整體壓向 [暗/亮] 端，落點應離開中性四色，考慮 #333333/#1A1A1A（或 #CCCCCC/#E6E6E6）。" This gives the model explicit permission to reach the outer shades when the data warrants it, which today's prompt never grants.

### 4. Keep the palette, keep the midpoint-forbidden rule

- Still exclude #808080. `snapAwayFromMid` stays.
- Palette stays at the same 10 hexes.
- Stance logic, Q11 weighting cap, and direction guardrail all stay unchanged.

## Out of scope

- No change to the 10-color palette or to the question tier values.
- No change to Q11 stance classification, gallery, UI, or scoring for choice questions.
- No new model — reuse `google/gemini-2.5-flash`.

## Technical notes

- All edits live in `src/lib/analyze.functions.ts`: `SYSTEM_PROMPT` (midpoint clause), `buildUserPrompt` (new distribution summary + lopsided-pattern directive).
- After the change, verify by re-running a few representative payloads mentally against the prompt and by watching new submissions for 中灰/中淺灰 dominance to drop below ~50%.