## Goal

Stop `/admin/references` from ever appearing as a blank/stuck page inside the editor preview. The route currently shows only "Loading…" (on a beige background it can read as blank) whenever `adminStatus()` or `listReferences()` rejects, because those promises are fired-and-forgotten and any rejection is swallowed.

## What's actually happening

- Locally the page renders correctly (login form in <1s, list resolves in ~1.3s), so the code path is not broken in a general sense.
- In the editor iframe, the two initial server-fn calls are the only things gating the UI. If either rejects (stale/corrupted `admin-gate` cookie, cold-start error, transient supabase failure) the code has no error branch — `unlocked` stays `null` forever and the "Loading…" pane is shown indefinitely on a `#f2efee` background, i.e. the "blank white page" the user reported.
- The `useEffect(() => { status().then(...) }, [])` pattern also swallows rejections silently, so nothing appears in the console UI either.

## Fix

Frontend-only, no schema or server-fn API changes.

1. **Surface mount errors**
   - In `AdminReferences`, wrap the initial `adminStatus()` in `try/catch`. On rejection, render a visible error card ("Couldn't reach the admin gate — <message>", with a Retry button) instead of leaving `unlocked === null`.
   - Same treatment in `Manager` for `listReferences()`: keep `docs` null while loading but capture any error into a `listError` state and render it above the (empty) list with a Retry button.

2. **Parallelize the initial requests**
   - Once `adminStatus` returns `unlocked: true`, `Manager` mounts and immediately triggers its own list fetch. Fire `adminStatus()` and an optimistic `listReferences()` in parallel with `Promise.allSettled` so the docs list is already in hand when Manager renders — saves the second sequential round-trip in the common signed-in case, and if the optimistic list fails because the session isn't valid we just discard it.

3. **Self-heal a bad session cookie**
   - Add a small server fn `adminResetSession()` that clears the `admin-gate` cookie. The error-card Retry button calls it before retrying, so a corrupted/rotated-secret cookie can't get the user permanently stuck on Loading.

4. **Add a visible timeout**
   - Race the mount fetches against a 15s timeout so a hung request surfaces as a clear "Request timed out — try again" instead of staying on Loading forever.

5. **Loading skeleton (cosmetic)**
   - Replace the bare "Loading…" text with a small skeleton block (title + two placeholder rows) so the page never looks blank while requests are in flight.

## Files touched

- `src/routes/admin.references.tsx` — add error state, try/catch, parallel `Promise.allSettled`, timeout race, skeleton, Retry button wiring.
- `src/lib/admin.functions.ts` — add `adminResetSession` server fn (clears session cookie, no auth required).

## Expected result

- The admin page never renders as blank/stuck. Any failure of `adminStatus` or `listReferences` shows an inline error with a Retry button.
- Signed-in mount shortens to one parallel round-trip.
- A stale/broken `admin-gate` cookie self-heals via the Retry flow.

No changes to analysis, uploads, PDF parsing, or any business logic.
