## Plan: fix Agent Cleo schema lookup properly

The current failure happens inside Agent Cleo’s `list_schema` tool before it reaches lesson queries. The tool sends a multiline `pg_class`/`pg_namespace` query, and the database validator rejects it even though it is intended to be read-only.

### What I will change

1. **Stop `list_schema` from using the fragile catalog query**
   - Replace the current `pg_class` schema discovery query with a simpler `information_schema.tables` query.
   - Keep it read-only and limited to the `public` schema.
   - Return table/view names and table type so the model can continue deciding which tables to inspect.

2. **Normalize SQL before sending it to the RPC**
   - In `agent-cleo`, trim and collapse tool-generated SQL into a clean single statement before calling `public.agent_cleo_exec`.
   - This avoids validator issues caused by leading newlines/indentation in internally generated queries.

3. **Keep security intact**
   - Do not add write access.
   - Do not expose service-role keys to the frontend.
   - Keep Agent Cleo restricted to admin/owner users and read-only database access.

4. **Improve failure handling**
   - If a tool fails, stop the tool loop cleanly instead of letting the model repeatedly retry the same broken tool.
   - Keep the visible error specific enough to debug.

5. **Deploy and verify**
   - Deploy the updated `agent-cleo` edge function.
   - Verify the schema path no longer errors by checking recent function/network output.
   - If an authenticated admin/owner browser token is not available in this environment, I’ll mark full in-browser admin-path verification separately rather than claiming it is verified.