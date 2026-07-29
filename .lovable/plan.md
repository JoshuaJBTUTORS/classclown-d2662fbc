## Diagnosis (verified)

The edge function is reaching the database fine — grants on `agent_cleo_exec` and per-table `SELECT` grants for `agent_cleo_readonly` are in place. The real problem is that:

- `agent_cleo_readonly` has `rolbypassrls = false`.
- Every relevant `public` table has RLS policies scoped to `authenticated` / `anon` / `has_role(auth.uid(), …)`.
- When the function `SET ROLE`s to `agent_cleo_readonly`, there is no `auth.uid()` and the role is neither `authenticated` nor `anon`, so **every policy filters to zero rows**.

Agent Cleo runs its queries, gets back empty arrays for `lessons`, `students`, etc., and narrates that as "the database tool returned a permissions/configuration error."

## Fix

One-line database change:

```sql
ALTER ROLE agent_cleo_readonly BYPASSRLS;
```

This preserves the security model that already matters:
- The role still has **no INSERT/UPDATE/DELETE** — writes are impossible at the database level.
- The role still has **no SELECT** on the sensitive tables we explicitly revoked (`user_roles`, `invitations`, `password_reset_tokens`, `google_oauth_states`).
- The edge function still gates callers to `admin` / `owner` before any tool runs.

The only thing that changes: for tables Agent Cleo is already granted `SELECT` on, it will now actually see the rows instead of an RLS-filtered empty set — which is the intended behaviour for an admin-only read-only analyst.

## Steps

1. Run migration: `ALTER ROLE agent_cleo_readonly BYPASSRLS;`
2. Ask the user to retry the same "this week's lessons" prompt in `/agent-cleo` and confirm real data comes back.

No edge-function code changes needed.
