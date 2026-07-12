## Problem

After entering the correct admin password, the UI flips back to the login form. `adminLogin` returns `ok: true`, but the very next `adminStatus` call returns `unlocked: false`. The Lovable preview loads the app inside a cross‑origin iframe, and the browser is dropping the `admin-gate` session cookie even though it's `SameSite=None; Secure` (third‑party cookie blocking / partitioning).

## Fix

Stop relying on a browser cookie for the admin gate. Switch to a **client-held bearer token** that survives in `localStorage` and is sent explicitly with every admin server-function call.

### Server (`src/lib/admin.server.ts`)
- Remove `useSession` / cookie config.
- Add `signAdminToken(payload, secret)` and `verifyAdminToken(token, secret)` using HMAC-SHA256 (`node:crypto`) — compact `base64url(payload).base64url(sig)` format with an `exp` timestamp (7 days).
- `requireAdminToken(token)` verifies the token; throws `Unauthorized` if missing/invalid/expired.
- Keep `adminPasswordMatches` unchanged.

### Server functions (`src/lib/admin.functions.ts`)
- `adminLogin`: on correct password, return `{ ok: true, token }`; on wrong password, `{ ok: false }`.
- `adminStatus({ token })`: return `{ unlocked: verifyAdminToken(token) }`; accept empty/missing token.
- `adminLogout`: becomes a no-op success (client just discards the token). Keep the export for compatibility.
- Remove `adminResetSession` (no longer needed).
- All data functions (`listReferences`, `getReferenceContent`, `uploadReference`, `toggleReference`, `deleteReference`) take `{ token, ...args }` and call `requireAdminToken(token)` before doing work.

### Client (`src/routes/admin.references.tsx`)
- Store the token in `localStorage` under `admin-token`; helper `getToken()` / `setToken()` / `clearToken()`.
- On mount, if a token exists, call `adminStatus({ data: { token } })`; if `unlocked`, load the list; otherwise clear the token and show login.
- On successful login, save the returned token and re-mount.
- Pass the token in every admin call.
- "Sign out" clears the token and re-renders the login form.
- Keep the existing loading / error / list / upload UI as-is.

## Why this works

The token travels in the request body (or an `Authorization`-style field we control), not a cookie, so third‑party cookie policies don't touch it. `localStorage` in the preview iframe is scoped to the preview origin and persists across reloads.

## Out of scope

No UI redesign, no changes to reference-document schema, no changes to `/` analysis flow.