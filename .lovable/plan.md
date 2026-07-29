## Problem
`public.agent_cleo_exec` rejects queries whose first token isn't literally `SELECT` or `WITH` followed by whitespace. The model routinely emits valid read-only SQL that this check misclassifies:

- Trailing `;` — hits the semicolon guard, but often the model retries and the first regex fails too on wrapped forms.
- Queries wrapped in parentheses (`(SELECT ... UNION SELECT ...)`) — first char is `(`, not `s`/`w`.
- Leading `EXPLAIN` / `EXPLAIN ANALYZE` (read-only variants) — starts with `explain`.
- Leading whitespace/newlines after `WITH` when the SQL is pretty-printed (currently OK because `\s` matches, but combined with a trailing `;` it still errors).

We also can't see the offending SQL — the error message doesn't include it, so debugging is guesswork.

## Fix
Update `public.agent_cleo_exec(sql text)` via a new migration so it:

1. **Normalizes input**: strip a single trailing `;` and surrounding whitespace before validation.
2. **Accepts read-only entry points**: allow the first significant token to be `SELECT`, `WITH`, `TABLE`, `VALUES`, or `EXPLAIN` (only when the explained statement itself starts with `SELECT`/`WITH`/`TABLE`/`VALUES` and does not contain the `ANALYZE` keyword, which would execute the plan). Also allow a leading `(` (parenthesized SELECT / set-op query).
3. **Keeps every existing safety guard**: single-statement (no interior `;`), no comments, no data-modifying keywords, no schema/catalog access, no function calls — unchanged.
4. **Improves the error message**: include the first ~80 characters of the offending SQL in the `RAISE EXCEPTION` messages so the edge function logs show what the model actually sent. Safe because Agent Cleo is admin-only.

No changes to grants, roles, or the edge function — only the validation logic inside the RPC.

## Technical notes
- New regex for the entry check (after stripping trailing `;`): `^\(*\s*(select|with|table|values|explain)\b`.
- For `EXPLAIN`, add a follow-up check: the remainder after `EXPLAIN [(...)]` must itself match the read-only entry regex, and the whole statement must not match `\banalyze\b` inside the `EXPLAIN (...)` options.
- Semicolon guard becomes: reject only if a `;` remains after stripping the single trailing one (prevents statement chaining while allowing "SELECT 1;").
- Error text example: `agent_cleo_exec only accepts SELECT / WITH / TABLE / VALUES / EXPLAIN queries (got: "DELETE FROM ...")`.
