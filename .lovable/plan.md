# Agent Cleo — Phase 1: Truly agentic read-only lesson access

Wire `/agent-cleo` to a real backend that talks directly to OpenAI (`gpt-5.6`, not via Lovable AI Gateway). The agent walks the database itself — no hardcoded table lists — and is hard-limited to read-only.

## Secret

Reuse the existing `OPENAI_API_KEY` already in the project. No new secret.

## Backend

New edge function: `supabase/functions/agent-cleo/index.ts`
- Auth: verify caller JWT, confirm `admin` or `owner` role via `has_role`. Reject otherwise.
- Streams `POST https://api.openai.com/v1/chat/completions` with `model: "gpt-5.6"`, `stream: true`, tool loop until final assistant turn. SSE forwarded to the browser.
- System prompt: "You are Agent Cleo, a read-only analyst for the Class Beyond CRM. Discover the schema yourself using the tools below, then answer. Never claim to modify data — you cannot."

### Tools exposed to the model (all read-only)

The agent decides which to call and in what order — that's what makes it agentic.

1. `list_schema` — returns every table + view in `public` (name, kind, row-count estimate). No arguments.
2. `describe_table` — args `{ table: string }`. Returns columns (name, type, nullable), primary key, and foreign keys. Lets the agent traverse relationships.
3. `sample_rows` — args `{ table: string, limit?: number ≤ 20 }`. Returns a small sample so the agent understands shape/values.
4. `run_sql` — args `{ sql: string }`. Executes arbitrary SELECT.

### Read-only enforcement (hard, not prompt-based)

The safety boundary is the DB role, not string parsing:
- Create a Postgres role `agent_cleo_readonly` with `GRANT USAGE ON SCHEMA public` and `GRANT SELECT ON ALL TABLES IN SCHEMA public` (plus `ALTER DEFAULT PRIVILEGES` for future tables). No INSERT/UPDATE/DELETE/DDL. Excluded from sensitive tables (`user_roles`, `auth.*`, secrets-bearing tables — final exclusion list confirmed during build after reading current schema).
- A SECURITY DEFINER function `public.agent_cleo_exec(sql text)` runs the query under this role via `SET LOCAL ROLE agent_cleo_readonly`, wraps in a read-only transaction (`SET TRANSACTION READ ONLY`), applies `statement_timeout = 15s`, and caps results (`LIMIT 500` injected if absent).
- Function is `EXECUTE`-granted only to `service_role`; the edge function invokes it via the service-role client. Any write attempt errors at the database, not in JS.
- Same function backs all four tools (schema queries are just SELECTs against `information_schema` / `pg_catalog`).

## Frontend

Update `src/pages/AgentCleo.tsx`:
- Replace mock send with streamed call to the `agent-cleo` edge function via `supabase.functions.invoke` (SSE reader).
- Render streamed assistant tokens into the active message bubble.
- Show a small status chip while a tool call is running (e.g. "Reading schema…", "Running query…") derived from tool-call deltas.
- In-memory conversation only for this phase.
- Preserve existing dark ChatGPT-style UI and "C" avatar.

## Out of scope (later phases)

- Persisting chat history / multi-thread sidebar wiring.
- Any write tools.
- Storage, edge function invocation, or non-`public` schemas.

## Technical notes

- Model id sent to OpenAI: `gpt-5.6` exactly. If OpenAI rejects it, we surface the error verbatim.
- OpenAI streaming SSE forwarded directly; frontend parses `choices[].delta.content` and `tool_calls` deltas.
- Browser never sees the OpenAI key and never talks to the DB directly.
