## Goal

Make `/admin/references` open quickly instead of stalling.

## Diagnosis

Two things stack up on first visit:

1. **`listReferences` returns full `content` for every row.** If you've uploaded a few PDFs, each row can be tens of thousands of characters. The list view never displays more than the first 2000 chars in a collapsed `<details>`, so we're shipping ~20× more text than needed over the wire.
2. **`pdfjs-dist` gets pulled into the route bundle.** Even though it's dynamically `import()`ed, Vite still fetches ~1MB of PDF worker code the first time it's needed, and browsers sometimes prefetch it eagerly. Not the main culprit, but worth deferring.
3. **Sequential requests on mount.** The page runs `adminStatus()` first, then only after it resolves fires `listReferences()`. Two server round-trips in series before anything shows.

## Fix

1. **Slim `listReferences`** — select `id, title, is_active, created_at, updated_at, char_count` and drop `content` from the list payload. Add a separate `getReferenceContent(id)` server fn used only when the user opens the Preview `<details>` (lazy).
   - `char_count` can be computed with `length(content)` via a Postgres expression in the select, so we still show the size badge without shipping the text.
2. **Parallelise mount requests** — fire `adminStatus()` and (optimistically) `listReferences()` in parallel; if unlocked=false, discard the list result. Or simpler: once unlocked, render `Manager` immediately and let its own fetch run — but skip the extra `Loading…` gate flash by combining both into a single `Promise.all`.
3. **Lazy-load pdfjs only on file pick** — keep the dynamic import, but also add a small "Parsing PDF…" state so it's clear what's happening. (Already dynamic; just verify no eager import path exists.)
4. **Add a lightweight skeleton** for the docs list so the page feels responsive while the (now much smaller) request is in flight.

## Technical notes

- New server fn signature: `getReferenceContent({ id }) → { content: string }`, admin-gated.
- Frontend `Doc` type loses `content`; the preview `<details>` fetches on first open and caches locally in component state.
- No schema change required; the `length(content)` projection is a plain SQL expression through PostgREST (`select=...,char_count:content->>length` won't work — instead we call it as `select=id,title,is_active,created_at,updated_at,char_count:content` and compute length client-side is wrong too; the correct path is a small RPC or a view). Simplest: add a lightweight Postgres **view** `reference_documents_summary` exposing `char_length(content) as char_count` and select from that. One migration, no data change.

## Expected result

First paint of `/admin/references` goes from "a lot of time" to a normal snappy load, because the list response drops from hundreds of KB (or MB) to a few hundred bytes per row. Preview content is fetched on demand.
