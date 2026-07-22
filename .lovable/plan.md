## Plan

1. **Update the edge function cleanup**
   - In `create-parent-account`, as soon as the proposal email is received, search Supabase Auth for any user with that email.
   - If found, delete that Auth user immediately before creating the new parent account.

2. **Remove stale parent rows too**
   - Before recreating the account, delete any `parents` row using the same email or the found Auth user ID.
   - This prevents the existing parent row from blocking the retry after the Auth user is deleted.

3. **Keep the existing create flow**
   - After cleanup, continue with the current flow:
     - find trial students
     - create Supabase Auth user
     - create parent profile
     - link trial students
     - return success

4. **Improve logging**
   - Add clear logs for:
     - matching Auth account found
     - parent row cleanup
     - Auth account deletion
     - new account creation

## Technical details

- Update `supabase/functions/create-parent-account/index.ts`.
- No database migration is needed.
- No frontend change is needed unless we want to pass extra context later.