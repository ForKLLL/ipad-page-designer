## Goal

Let you upload your own reference material (PDF/TXT/MD) that the AI always consults when writing the B-value analysis, so the tone and content stay grounded in your source rather than the model's general knowledge.

## Approach

Because your resource is short and you want it always included, we skip embeddings/vector search. The full reference text lives in the database and is injected into every AI call as extra system context.

## Steps

1. **Database**
   - New table `reference_documents`: `title`, `content` (text), `is_active` (bool), timestamps.
   - RLS: public read (so the server fn can load it via the publishable key); writes restricted to service_role only (managed through the admin page).
   - Simple `settings` isn't needed — we just load all rows where `is_active = true` and concatenate.

2. **Admin upload page** at `/admin/references`
   - Password-gated with a shared secret (`ADMIN_PASSWORD`) stored via `add_secret` — no full auth system needed for a single-operator exhibition tool.
   - Upload PDF / TXT / MD files. Parsing:
     - TXT/MD: read as text directly.
     - PDF: parsed server-side using `pdfjs-dist` (Worker-compatible, pure JS — avoids `pdf-parse`/native binaries which fail on Cloudflare Workers).
   - List existing documents with toggle (active/inactive) and delete.
   - Server functions: `uploadReference`, `listReferences`, `toggleReference`, `deleteReference` — all guarded by the admin password.

3. **Wire into analysis** (`src/lib/analyze.functions.ts`)
   - Before calling the AI, load all active reference docs via the server publishable client.
   - Append them to the system prompt under a clearly delimited section:
     ```
     【參考資料 Reference Material】(Ground your analysis in the following; do not contradict it)
     --- <title> ---
     <content>
     ---
     ```
   - Keep the existing Core Directives / Output Format rules above the reference block so structure is preserved.
   - Add a soft length guard: if total reference chars > ~40k, truncate with a note (well under Gemini's context window but avoids runaway cost).

4. **Small UX touch**
   - Link to `/admin/references` from nowhere in the public UI — you reach it by URL only.

## Technical Notes

- No vector DB, no embeddings — always-include keeps setup minimal and matches your choice.
- PDF parsing runs inside a server function using `pdfjs-dist`'s legacy build (Worker-safe). If a PDF fails to parse, we surface the error and ask you to upload TXT/MD instead.
- Reference content is loaded fresh on every analysis call (no caching layer needed at exhibition scale). If you later see latency, we can cache in-memory per-request.
- Files themselves aren't stored — only the extracted text goes into the DB, which is all the AI needs.

## What you'll do after this ships

1. I'll ask you for an `ADMIN_PASSWORD` via the secret form.
2. You visit `/admin/references`, log in, upload your reference PDF(s).
3. Every subsequent test uses those documents as grounding.
