## Plan: fix the actual `list_schema` validator bug

I verified the live database function and reproduced the matcher issue directly in Postgres:

```text
current regex with \b: false
fixed regex with ($|[^a-z_]): true
```

So the function is still rejecting valid `SELECT ...` queries because Postgres is not treating `\b` as the word boundary intended in this regex.

### Changes to make

1. **Patch `public.agent_cleo_exec`**
   - Replace the fragile start-of-query regex:
     ```text
     ^\(*\s*(select|with|table|values|explain)\b
     ```
   - With a Postgres-safe boundary:
     ```text
     ^\(*\s*(select|with|table|values|explain)($|[^a-z_])
     ```
   - Apply the same fix to the EXPLAIN body validator.

2. **Keep all read-only security guards**
   - Keep blocking write/admin keywords.
   - Keep blocking internal schemas and sensitive catalog tables.
   - Keep function-call restrictions.
   - Keep Agent Cleo read-only.

3. **Verify with the exact failing query**
   - Run the `information_schema.tables` query through `public.agent_cleo_exec` after the migration.
   - Confirm it returns schema rows instead of the `only accepts SELECT / WITH...` error.

4. **Redeploy Agent Cleo if needed**
   - The edge function source was already updated, but I’ll redeploy `agent-cleo` after the DB patch so the live function and DB helper are aligned.

5. **Final check**
   - Check fresh `agent-cleo` logs for the old `list_schema` failure.
   - If authenticated preview testing is available, call `/agent-cleo` with the user’s session and verify a lesson question works.