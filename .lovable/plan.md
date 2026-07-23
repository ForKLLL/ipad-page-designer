## Diagnosis (confirmed)

Checked the DB: of 9 total submissions, 4 landed on **#4D4D4D 中暗灰** (B=30), plus 1 at B=10, 2 at B=50, 2 at B=70 — nothing above B=70, nothing at pure black/white. Reading the stored analyses, the model itself is the one repeatedly choosing #4D4D4D and justifying it with "堅忍/務實/默默承受/內斂克制" language.

Two compounding causes:

1. **Question tiers are skewed low.** Most of the 10 questions map their 4 options to roughly `[0–10, 30–40, 60–70, 90–100]`. The second option (very common "sensible/practical" pick) is worth B≈30, i.e. exactly #4D4D4D. A user picking mostly option 2 will average right around 30.
2. **Prompt bias toward #4D4D4D.** The description for #4D4D4D ("深藏不露、務實、蓄勢待發") is the most universally flattering / relatable archetype in the list, so the model gravitates to it whenever answers look "reserved but functional" — which is most of them. There is also no explicit instruction to use the aggregated B from the choice questions as the primary anchor, so the free text and vibe dominate.

## Plan

### 1. Rebalance the choice-question tiers (`src/routes/index.tsx`)
Rewrite `tiers` on both `QUESTIONS_ZH` and `QUESTIONS_EN` so the four options span the full 0–100 range more evenly and, critically, so option 2 is not glued to 30. Target distribution per question: roughly `[10, 40, 65, 90]` with small per-question variation (some `[0,35,65,95]`, some `[15,45,70,90]`) so the average of a mixed answer sheet lands near 50, not 30.

### 2. Anchor the model to the aggregated B (`src/lib/analyze.functions.ts`)
- Pass a pre-computed `avgB` (average of answered `tiers`) into the user prompt so the model sees "選擇題平均 B≈XX" as a hard anchor.
- Add a directive to `SYSTEM_PROMPT`: the chosen Hex must be within ±15 of the choice-question average unless the open-text answer *strongly* contradicts it, in which case shift by at most one tier. This stops the model from collapsing everyone into #4D4D4D on vibes.
- Soften the #4D4D4D description slightly (remove "蓄勢待發" default-archetype framing) and beef up the equally-valid neighbours (#666666, #808080) so it stops being the path of least resistance.

### 3. No schema / no gallery changes
Existing rows stay as-is. Only new submissions get the rebalanced behaviour.

## Technical notes
- `pickShade` / `HEX_TO_B` already snap by decile, so widening tiers is safe — the client will still map into one of the 11 shades.
- No DB migration needed. No changes to `analyze.functions.ts` input schema (tiers array is already forwarded per question).
- Build check with `tsgo` after edits.
