## Update analysis prompt

Replace the `SYSTEM_PROMPT` constant in `src/lib/analyze.functions.ts` with the new guide you pasted, preserving the existing pipeline (reference documents append, hex extraction, B value mapping).

### Changes

- **`src/lib/analyze.functions.ts`** — swap `SYSTEM_PROMPT` for the new version:
  - Full Role & Context, Core Directives, Input logic sections as written.
  - Expanded 11-color interpretations (each color's psychology + balance reading, condensed slightly to stay readable but keeping all key concepts: authority/defense, resilience, sincerity/restraint, pragmatism, buffer, absolute calm, acceptance, warm order, efficiency, transcendent calm, purity/distance).
  - Include the color-psychology theoretical backing (Valdez & Mehrabian formulas, Jonauskaite 2025 meta-review, Max Planck alpha-wave note, Eva Heller, Galinsky) as a compact "理論依據" block so the AI can draw on it.
  - Keep the Output Format (3-part structure, 200–250 字, opening sentence template) and Tone guidance.
  - Keep the trailing instruction: output only Traditional Chinese, no markdown, first sentence must match `你的測驗結果指向了 #XXXXXX [顏色名稱]。`

### Not changing

- Input schema, user prompt builder, reference-document loading, model (`google/gemini-2.5-flash`), hex parsing, and B-value mapping all stay the same.
- No UI or database changes.
