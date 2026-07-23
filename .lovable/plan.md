## Goal
Enforce output length limits on the AI analysis: Chinese ≤ 300 字, English ≤ 200 words.

## Change
`src/lib/analyze.functions.ts` only.

1. Update the `SYSTEM_PROMPT` Output Format block: change the current "約 200–250 字" instruction to a hard cap of **300 字以內（繁體中文，不含標點與 Hex code）**, and instruct the model to self-truncate if approaching the limit while still closing all three tiers.
2. Update the English `langDirective`: replace "~200 words" with a hard cap "**Keep the entire response under 200 words**", still requiring the three-tier structure and the fixed first sentence.
3. No changes to schema, parsing, or UI. Hex extraction and B-value mapping remain the same.

## Notes
Limits are enforced via prompt instructions (Gemini follows length caps reliably at this scale). No `max_tokens` change needed, but I'll add a modest `max_tokens` ceiling in the request body as a safety net so runaway output can't exceed the caps.
