## Plan

1. **Replace the broken role-switching RPC**
   - Update `public.agent_cleo_exec(sql text)` so it no longer calls `set_config('role', ...)` inside a `SECURITY DEFINER` function, which Postgres blocks with `cannot set parameter "role" within security-definer function`.
   - Keep the function strictly read-only by continuing to allow only queries beginning with `SELECT` or `WITH`, applying a statement timeout, and wrapping results as JSON.

2. **Preserve admin-only access at the edge function layer**
   - Keep `/agent-cleo` restricted to users with `admin` or `owner` roles before any database tool runs.
   - Continue using the service client only after that role check succeeds.

3. **Tighten query safety**
   - Add stronger SQL guards to reject write/admin commands even if they are embedded in a `WITH` query or multi-statement string.
   - Cap output with the existing 500-row limit.

4. **Deploy and test Agent Cleo**
   - Deploy the `agent-cleo` edge function if its tool logic needs any matching changes.
   - Test `list_schema` through the edge function, then test a simple lesson read query to confirm Agent Cleo can inspect lessons again.

## Technical details

- Confirmed current root cause: the live `public.agent_cleo_exec` function calls `set_config('role', 'agent_cleo_readonly', true)`, and Postgres does not allow changing `role` inside a security-definer function.
- The fix is a database migration that removes the internal role switch from the RPC rather than trying to grant more permissions.
- Since this function executes as its owner, the safety boundary becomes: admin/owner-only edge access, SQL command validation, timeout, and SELECT/WITH-only execution.