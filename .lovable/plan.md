## Current bias (measured, not assumed)

I averaged the per-option tier values across the 10 choice questions in `src/routes/index.tsx`:

| Option position | Avg B | Snaps to |
|---|---|---|
| 0 (darkest pick) | **11** | #1A1A1A |
| 1 | **42** | #666666 |
| 2 | **67** | #B3B3B3 |
| 3 (brightest pick) | **91.5** | #E6E6E6 |

Combined with the anchor formula `(2×choiceAvg + freeTextB) / 3` in `src/lib/analyze.functions.ts`, this produces three structural biases:

1. **Middle-collapse**: uniformly mixed answers → choiceAvg ≈ 52.9 → anchor snaps to **#808080**. Any "balanced" respondent lands in mid-grey.
2. **Extremes unreachable via anchor**: choiceAvg is bounded to [11, 91.5]. Even with free-text pulling to 0 or 100, the combined anchor range is only [7.3, 94.3]. That means **#000000 and #FFFFFF can never land as the anchor**, and #1A1A1A / #E6E6E6 are only reachable with near-perfect extreme runs. The model, told to treat the anchor as a starting point, will rarely pick the true extremes.
3. **Asymmetry**: the gap from pos-0 (11) to midpoint (50) is 39, but from pos-3 (91.5) to midpoint is 41.5, so pos-3 picks pull slightly farther. More importantly, pos-1 (42) snaps inward to #666666 while pos-2 (67) snaps outward to #B3B3B3 — the interior isn't symmetric around #808080.

## Proposed fix (scoring only — no prompt/UI changes)

Replace all 10 questions' `tiers` in `src/routes/index.tsx` with a single symmetric ladder:

```
tiers: [3, 37, 63, 97]
```

Why this ladder:
- **Symmetric around 50**: uniform random answers now average exactly 50 → #808080 becomes the *true* middle, not a default sink.
- **Full range reachable**: all-pos-0 → anchor min ≈ 2 → snaps to **#000000**; all-pos-3 → anchor max ≈ 98 → snaps to **#FFFFFF**. Every one of the 11 shades is reachable by the anchor without relying on the model to override.
- **Even spacing (~33 apart)**: pos-1 snaps to #666666 (40), pos-2 snaps to #B3B3B3 (70) — same distance from #808080 on each side; pos-0 snaps to #000000, pos-3 snaps to #FFFFFF — same distance from the extremes.
- **Preserves current UX**: still 4 options per question, still ordered darkest→brightest, still 10 questions.

No changes to `src/lib/analyze.functions.ts`, the AI prompt, the questions/wording, the free-text B classifier, or the UI. The anchor formula stays as-is; it just now spans the full palette symmetrically.

## Follow-up sanity check

After the edit I'll:
1. Recompute per-position averages to confirm 3 / 37 / 63 / 97 across all 10 questions.
2. Simulate a few answer patterns (all pos-0, all pos-3, alternating, all pos-1) and verify the anchor lands on the expected hex.

## Out of scope (flagging, not changing unless you ask)

- The Q11 free-text weight (currently 1/3 of the anchor). It's symmetric so it doesn't favor any color; leaving it alone.
- The system prompt's "anchor is a reference only" language. With a symmetric ladder this instruction becomes safe rather than corrective, so no edit needed.
- The mood-swatch pre-selection screen — already documented as non-scoring.