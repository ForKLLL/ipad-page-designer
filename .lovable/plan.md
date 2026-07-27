## Goal

Stop treating Q11 as a one-dimensional brightness guess. Read it on two axes — **brightness** (dark ↔ light) and **stance** (how the participant relates to what they wrote) — and feed both into the main analyst so attitude actually influences the final Hex.

## Why

Today `classifyFreeTextB` asks only "how bright is this text, 0–100?" A sentence like *"white, but I can never reach it"* or *"I'm tired of how bright everything is"* returns ~90 and pulls the result lighter, even though the attitude is longing/rejection, not embodiment. The main analyst sees the raw text but has no explicit stance signal to weigh against the numeric B.

## Change (all in `src/lib/analyze.functions.ts`)

### 1. Replace `classifyFreeTextB` with `classifyFreeText` returning two fields

Single Gemini call, JSON output:

```
{ "b": 0-100 (snapped to nearest 10, never 50),
  "stance": "embodiment" | "aspiration" | "rejection" | "ambivalence" | "description" }
```

Stance definitions given in the classifier system prompt:
- **embodiment** — describes the state they currently inhabit ("我就是這樣的安靜")
- **aspiration** — a state they want but don't have ("我希望能變得更白")
- **rejection** — pushing away from the named state ("我討厭那種刺眼的白")
- **ambivalence** — pulled both ways ("想要亮，但又害怕")
- **description** — neutral imagery with no clear personal stance ("像清晨的霧")

Keep the existing snap-away-from-50 logic on the returned `b`. If parsing fails, fall back to `{ b: null, stance: "description" }` so the rest of the flow stays intact.

### 2. Adjust weighting by stance in `buildUserPrompt`

The current 10:2 / 10:3 weighting stays as the baseline, but the effective Q11 weight is scaled by stance:

- `embodiment` → full weight (current behavior)
- `description` → full weight
- `aspiration` → half weight, and mark the B as "aspirational, not current"
- `rejection` → half weight and invert direction relative to choices (nudge *away* from the stated B, not toward it)
- `ambivalence` → quarter weight; surface the tension explicitly

The direction guardrail stays: Q11 still cannot flip the choice-driven direction; it only shifts one decile.

### 3. Surface stance to the main analyst

Add lines to the user prompt:

```
Q11 stance: aspiration (使用者描述的是嚮往的狀態，非當下)
Q11 estimated B: 90 (aspirational, weight halved)
Effective Q11 contribution: B≈70 @ weight 1 (of 12)
```

### 4. Update `SYSTEM_PROMPT` with a short "Q11 stance" clause

Tell the analyst:
- Read the stance tag alongside the raw Q11 text before deciding tone.
- Aspiration/rejection mean the named brightness is *not* where the person currently sits — reflect the gap in the Mechanism paragraph.
- Ambivalence is a signal to name the tension, not smooth it.
- The final Hex still comes from the choice-driven direction; stance modulates *where inside that direction* the point lands and *how* the analysis reads.

## Out of scope

- No changes to the 10-color palette, snapping rules, or midpoint exclusion.
- No changes to the UI, gallery, DB schema, or scoring for the 10 choice questions.
- No new model — reuse `google/gemini-2.5-flash` for both the classifier and main call.

## Technical notes

- `classifyFreeText` uses `response_format: { type: "json_object" }` and a strict "reply with JSON only" system prompt; wrap the parse in try/catch and fall back to the safe default.
- Keep the two calls parallel with `loadReferenceBlock` via `Promise.all`.
- No schema-bound `Output.object` (per AI SDK guardrails); we parse the JSON manually and validate the stance against the allowed enum in code.
