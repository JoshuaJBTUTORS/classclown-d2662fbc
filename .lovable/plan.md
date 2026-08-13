# Why Hajra was missed by Monday's homework sync

## Root cause: the run died part-way through and the rest of the queue was silently dropped

Monday 10 Aug, week `2026-08-03`:

- Eligible students that week (brief present, lesson not cancelled): **50**
- Students actually synced: **23**
- Run window: 06:00:14 → 06:03:22 UTC, then nothing.

Hajra was not skipped for a data reason. Her English brief existed from 9 Aug 14:00 (well before the run), attendance was marked `attended`, subject is not filtered. She was simply sitting further down the queue than the function got to. She only synced on 12 Aug 16:02 because that was the manual run.

The function paces itself with a 5-second sleep between students and then, at `maxRunMs = 240000`, is supposed to hand the remaining students to a fresh invocation. It never reached that check — the invocation was killed at ~188 seconds, so the handoff `fetch` never fired and the remaining ~27 students were lost with no error and no log row. That is why nothing looked wrong until a parent complained.

## The fix

1. **Chunk the queue properly instead of racing a timeout.** Each invocation processes a fixed, small batch (20 students), then immediately chains the next batch by re-invoking itself with the remaining `student_ids`. No dependence on wall-clock guesswork.
2. **Lower the safety cut-off** from 240s to 90s as a second line of defence, so a slow batch still hands off before the runtime kills it.
3. **Fire the handoff before the work, not after.** Kick off the next invocation as soon as the batch boundary is known, so a mid-batch death can no longer take the rest of the queue with it.
4. **Log a run manifest.** At the start of a run, write one `notifications` row per eligible student with status `queued` for that week; flip it to `sent`/`failed` as each is processed. Anything still `queued` at the end is visibly unfinished.
5. **Add a reconciliation pass.** A second cron a few hours after the main run re-invokes the sync for the same week limited to students who have a brief but no `sent` sync row — a self-healing sweep so a partial run fixes itself before anyone notices.

## Backfill for the week that was missed

Re-run week `2026-08-03` restricted to the students with a brief but no sync row (Hajra plus the other ~26), with notifications enabled only for those who never received the release message — the `notifications` de-duplication already prevents double-messaging anyone who did.

## Technical detail

All changes live in `supabase/functions/weekly-homework-sync/index.ts`:

- Replace the `runStartedAt`/`maxRunMs` guard with an explicit `batch_size` (default 20) slice of `byStudent`, plus the chained self-invocation for the remainder.
- Add `queued` manifest rows keyed the same way as today (`type: heycleo_weekly_homework_sync`, `subject: <week> · queued`, `email: <contact>`), updated in place per student.
- New optional body flag `missing_only: true` to select only students lacking a `sent` row for the week — used by both the backfill and the reconciliation cron.
- New `pg_cron` job `weekly-homework-sync-reconcile`, Monday 10:00 UTC, posting `{"missing_only": true}` (created with the data tool, matching the existing job style).

No schema changes.
