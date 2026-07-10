## Plan

1. **Fix the admin session setup**
   - Move the session configuration and password comparison helpers out of the server-function module scope into server-only code or inside handlers, so TanStack’s server-function transform doesn’t strip code needed at runtime.
   - Keep the admin password in the existing backend secret; it will not be exposed to the browser.

2. **Stop the login page from calling protected document loading before entry**
   - On page load, check only `adminStatus`.
   - Call `listReferences` only after the admin session is confirmed unlocked, avoiding the repeated `Unauthorized` server-function calls currently visible in network logs.

3. **Improve failure handling on the admin form**
   - Wrap login in `try/catch` so backend/session errors show a clear message instead of leaving the form stuck.
   - Keep the existing incorrect-password behavior for wrong passwords.

4. **Verify the flow**
   - Test `/admin/references` renders the password form while locked.
   - Confirm entering the configured admin password unlocks the reference manager and loads documents without `Unauthorized` spam.