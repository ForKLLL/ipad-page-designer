## Goal

Add a **中 / EN** toggle in the top-right corner of every screen. Default Chinese, session-only (resets on reload). Toggle translates the 10 questions + options **and** switches the AI analysis output language. UI chrome and existing gallery cards stay as-is.

## Changes

### 1. `src/routes/index.tsx`
- Add a `lang` state (`"zh" | "en"`, default `"zh"`) on the top-level `BalancEApp`, held in memory only (no storage).
- Add English strings for each of the 10 questions and their 4 options (I'll write them as faithful translations of the current Chinese prompts; you can revise any wording after).
- The question renderer reads from `QUESTIONS_ZH` or `QUESTIONS_EN` based on `lang`. Answer indices (0–3) and tier mappings are language-independent, so switching mid-quiz preserves progress.
- Q11 free-text placeholder text switches with `lang`; user input is passed through unchanged.
- A small top-right `LangToggle` component (`中 / EN` pill, JetBrains Mono, minimal styling matching existing chrome) is rendered on **all** screens (intro, question, free, loading, result, gallery). It floats absolutely in the header row.
- Pass `lang` into `analyzeBalance` server call so the AI can respond in the chosen language.

### 2. `src/lib/analyze.functions.ts`
- Extend `InputSchema` with `lang: z.enum(["zh","en"]).default("zh")`.
- Append a single directive to the system prompt at call time:
  - `zh` → keep current behavior (Traditional Chinese output, existing format rule).
  - `en` → "Respond in English. First sentence: `Your result points to #XXXXXX [Color Name].` Keep the same three-tier structure and ~200 words."
- Hex parsing and B-value mapping are unchanged.

### 3. Not changed
- Database schema, gallery cards (existing rows keep their original language), reference-document flow, admin pages, and all styling elsewhere.

## Behavior notes

- Toggle mid-quiz: questions re-render in the new language instantly; already-picked answers stay selected.
- Result language matches whatever `lang` was at submission time and is stored verbatim in `results.analysis`, so the gallery will naturally contain a mix of ZH and EN cards over time.
