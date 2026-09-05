# Fix homework pull error: "invalid input syntax for type integer: 1.33"

## What's happening

The hourly HeyCleo homework pull is failing. HeyCleo has started sending `marks_awarded` / `marks_available` as decimal values (e.g. `"1.33"`), but our `heycleo_homework_completion` table stores them as whole numbers (integer). Postgres rejects the fraction, the entire 500-row upsert batch fails, and the sync shows an error on `/admin/heycleo-data` — so no homework has synced since.

## The fix

In `supabase/functions/heycleo-pull/index.ts`, sanitise the numeric fields before upserting:

1. **Coerce marks to whole numbers** — parse `marks_awarded` and `marks_available` as numbers, round to the nearest integer, and store `null` when the value is empty or not a number (instead of crashing the run).
2. **Coerce `percentage`** the same way (it's already a numeric column, but guard against empty strings / non-numbers).
3. **One bad row can't sink the batch** — if a 500-row upsert chunk fails, fall back to upserting rows one-by-one, skipping and logging only the genuinely bad rows, so 897 good rows still sync.

No database schema change. The cron jobs keep running as-is; the next hourly run (or a manual "Sync now") will pull everything through.

## Verification

- Trigger the function after deploy and confirm the sync state returns to `success` with rows synced and the error cleared on the admin page.
