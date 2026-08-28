# Make HeyCleo data mirror what HeyCleo actually sends

Today the hourly homework sync and the nightly student sync run in incremental mode: they only ask HeyCleo for records changed since the last cursor, and they only ever add or update rows. Anything HeyCleo stops sending (a deleted or superseded assignment) stays in our database forever and keeps showing as outstanding — that is exactly what happened with Kian's "week of 2026-08-03" homework. Pruning only happens on a manual `full: true` run.

## The change

Make the scheduled syncs authoritative instead of additive.

**1. Hourly homework sync becomes a full pull**
- The homework dataset is small (~850 rows), so a complete pull each hour is cheap and removes the need to trust cursors at all.
- Every hourly run fetches the full current set from HeyCleo, upserts it, then deletes any row HeyCleo did not return in that run — the same prune logic that already exists for manual full pulls.

**2. Nightly student sync becomes a full pull**
- Same treatment at 02:00: pull everything, upsert, prune what is gone.

**3. Safety rail on pruning**
- Pruning only runs when the pull completed cleanly and returned a plausible number of rows. If a run returns zero rows, or fewer than 50% of what we currently store, we upsert nothing extra and skip the delete, log a warning, and mark the sync state as `warning` rather than silently emptying the tables on an upstream outage.

**4. Visibility on the admin page**
- `/admin/heycleo-data` shows, per dataset, the last run time, rows pulled, rows pruned, and status (success / warning / error), so a skipped prune or a failed run is obvious rather than invisible.
- The "Sync now" button runs the same authoritative full pull.

## Technical details

- `supabase/functions/heycleo-pull/index.ts`: default `full` to true for both resources; keep the cursor read only for an explicit `{ "full": false }` call so incremental remains available for debugging. Move the prune behind the sanity check described above, and return `pruned` counts in the response.
- `heycleo_sync_state`: record `rows_synced`, a new `rows_pruned`, and allow `last_status = 'warning'`.
- Cron jobs 27 (`heycleo-pull-students`, daily 02:00) and 28 (`heycleo-pull-homework`, hourly) keep their schedules; their request bodies gain `"full": true` so the intent is explicit in the job definition as well as in code.
- No change to what we send to HeyCleo — this stays a read-only mirror.

## Result

Within an hour of HeyCleo changing or removing an assignment, our calendar chips, homework panels and nudge reminders reflect HeyCleo's current truth, with no stale "not completed" rows lingering.
