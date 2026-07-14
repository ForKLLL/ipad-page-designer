## Goal

Anyone can take the test and submit a result. All submissions appear in a public gallery. Nobody (not even the submitter) can edit or delete their own row. The admin (already gated by the existing password + bearer-token flow) can take down individual submissions from an admin view.

## Database (one migration)

Table `results` today allows public INSERT with `WITH CHECK (true)` and public SELECT. Keep both, tighten INSERT, and route deletes through the admin server function using the service role.

- Keep policy: `Anyone can view results` (SELECT to anon+authenticated, `USING (true)`) — needed for the public gallery.
- Replace policy: `Anyone can submit results` (INSERT to anon+authenticated) with a validated `WITH CHECK`:
  - `b_value BETWEEN 0 AND 100`
  - `length(shade_name) BETWEEN 1 AND 40`
  - `hex ~ '^#[0-9A-Fa-f]{6}$'`
  - `length(analysis) BETWEEN 1 AND 4000`
  - `free_text IS NULL OR length(free_text) <= 500`
- No UPDATE or DELETE policy is added, so users (anon and authenticated) cannot modify or remove rows. This resolves the "always true" warn for INSERT and blocks tampering.
- Admin deletion happens server-side via `supabaseAdmin` (service role bypasses RLS), so no DELETE policy is needed for the admin path.

## Server functions (`src/lib/admin.functions.ts`)

Add two admin-gated functions (same bearer-token pattern as the reference-documents ones):

- `listResults({ token })` → returns `id, created_at, b_value, shade_name, hex, analysis, free_text` ordered by `created_at desc`. Calls `requireAdminToken`, uses `supabaseAdmin`.
- `deleteResult({ token, id })` → `requireAdminToken`, then `supabaseAdmin.from('results').delete().eq('id', id)`.

No change to the existing `analyzeBalance` or reference-document flow.

## Public gallery route (`src/routes/gallery.tsx`)

New public route (SSR default, no auth gate). Reads from `results` using the browser Supabase client (public SELECT policy already covers this):

```
supabase.from('results')
  .select('id, created_at, b_value, shade_name, hex, analysis, free_text')
  .order('created_at', { ascending: false })
  .limit(200)
```

- Head: title/description/OG tags for the gallery.
- Layout: responsive grid of cards. Each card shows the hex swatch (background = `hex`), `shade_name`, `b_value`, a truncated `analysis`, and (if present) `free_text`. Click to expand full analysis in a dialog. Read-only — no edit/delete controls.
- Empty state: friendly "還沒有作品" message.

## Link the gallery from the home page

Add a subtle "查看藝廊 / Gallery" link in the existing index page header/footer so users can reach it after finishing the test. No redesign of `/`.

## Admin submissions view (`src/routes/admin.submissions.tsx`)

New admin route mirroring the existing `admin.references.tsx` pattern:

- Same bearer-token gate (`localStorage` `admin-token`, `adminStatus`, login form on lock).
- Table/list of submissions from `listResults`: swatch, shade name, hex, b value, created_at, truncated analysis, free_text, and a "Take down" (delete) button with a confirm dialog.
- Header links between `/admin/references` and `/admin/submissions` so the admin can move between the two views without re-entering the password.

Existing `admin.references.tsx` is not modified beyond adding a nav link to the submissions view.

## Out of scope

- No user accounts / auth on the test flow.
- No editing of submissions by anyone (spec-required).
- No changes to the analysis prompt, reference documents, or `/` quiz UX beyond adding the gallery link.
- No moderation queue / soft-delete — admin delete is hard delete via service role.

## Technical notes

- The tightened INSERT `WITH CHECK` covers the Supabase linter warning by replacing `true` with real constraints while keeping anonymous submissions working.
- Public gallery reads run through the browser publishable client — no server function needed, matches the existing `results` public SELECT policy.
- Admin delete goes through `supabaseAdmin`; no new RLS policy for DELETE, so RLS still blocks tampering from the client.
