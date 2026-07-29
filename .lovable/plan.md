## Problem (verified)

In `supabase/functions/agent-cleo/index.ts`, after a tool runs, any failure result immediately kills the whole run:

```
if (parsedResult?.ok === false) {
  send({ type: "error", error: `${call.name} failed: ${parsedResult.error}` });
  controller.close();   // stream ends, model never sees the error
  return;
}
```

So the model never gets the error back, can't rewrite the query, and the user just sees a red line like `run_sql failed: function similarity(text, text) does not exist`. Two other hard stops behave the same way: an OpenAI non-200 response, and `Max tool steps reached`.

Separately, that specific failure is real: I checked `pg_extension` and neither `pg_trgm` nor `fuzzystrmatch` is installed, so `similarity()` / `%` fuzzy matching genuinely doesn't exist in this database — Cleo keeps reaching for it because nothing tells it not to.

## The fix

**1. Feed tool errors back to the model instead of ending the run**

Replace the abort with: push the error JSON into `messages` as the tool result, emit a soft `tool_error` event (rendered as a small amber "retrying…" note, not a fatal red error), and continue the loop. The model then sees the exact Postgres message and can fix its own SQL.

Track failures per turn: keep a counter of consecutive failures for the same tool. After 3 consecutive failures, inject a system nudge telling the model to stop retrying the same shape and either try a fundamentally different approach or explain to the user what it couldn't do. After 6 total tool failures in a turn, stop the loop but still let the model produce a final text answer explaining the limitation, rather than dropping a raw error.

**2. Attach recovery hints to known error classes**

In `runTool`'s catch block, map common Postgres errors to an actionable hint returned alongside the error, e.g.:
- `function X does not exist` → "That function/extension is not available in this database. Use plain SQL — e.g. `ILIKE '%name%'`, `lower()`, or `split_part` — instead of trigram/fuzzy functions."
- `column ... does not exist` / `relation ... does not exist` → "Call `describe_table` on the table first and use exact column names."
- `syntax error at or near` → "Rewrite the query; check quoting and CTE structure."
- timeouts / statement cancelled → "Narrow the date range or add a tighter LIMIT and try again."

**3. Add a failure-recovery protocol to the system prompt**

New section telling Cleo explicitly: tool errors are recoverable, never surface a raw error to the user; read the message, change approach, retry at most 3 times per problem, escalate through describe_table/sample_rows to check assumptions; never repeat an identical failing query. Plus a hard note: `pg_trgm`/`similarity()`/`%` and `fuzzystrmatch` are not installed — use `ILIKE`, `lower()`, or `soundex`-free plain SQL for name matching.

**4. Make the OpenAI call itself resilient**

Retry a 429 or 5xx from OpenAI up to 3 times with exponential backoff (1s/2s/4s) before surfacing an error. Non-retryable statuses (400/401/403) still surface immediately with the message.

**5. UI: distinguish recoverable from fatal**

In `src/pages/AgentCleo.tsx`, handle the new `tool_error` event as an inline muted "⚠ retrying a different way" chip inside the tool activity area, keeping the fatal red banner only for the terminal `error` event.

## Technical notes

- Files touched: `supabase/functions/agent-cleo/index.ts`, `src/pages/AgentCleo.tsx`. No database migration required.
- The existing 20-step loop cap stays; the failure counters sit inside it.
- No change to write behaviour — lesson creation still requires the user to press Confirm.

## Optional (not included unless you want it)

Installing `pg_trgm` would give Cleo real fuzzy name search (helpful for "find the student called Aziah/Azia"). That's a database extension change and a separate decision — say the word and I'll add it.
