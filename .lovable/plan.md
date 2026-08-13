# Fix: weekly homework sync drops the tail of the queue

## What went wrong (confirmed)

Monday 10 Aug, week `2026-08-03`:

- Eligible students (brief present, lesson not cancelled): **50**
- Students actually synced: **23**
- Run window: 06:00:14 → 06:03:22 UTC, then silence.

Hajra was not filtered out — her English brief existed from 9 Aug 14:00, attendance was `attended`. She was simply further down the queue than the run got to. The function paces 5 seconds between students and only checks its 240s handoff guard after each student; the invocation was killed at ~188s, so the handoff never fired and ~27 students vanished with no error and no log row.

## Step 1 — make the queue survive (this step only, no backfill yet)

In `supabase/functions/weekly-homework-sync/index.ts`:

1. Replace the wall-clock guard with explicit chunking: each invocation takes a fixed slice of the student queue (`batch_size`, default 20) and passes the remaining student IDs to a fresh self-invocation.
2. Trigger that self-invocation **before** processing the batch, so a mid-batch death can no longer take the rest of the queue with it.
3. Keep a 90s safety cut-off as a second line of defence, well under the runtime limit.
4. Write a run manifest: at the start, one `notifications` row per eligible student for the week with status `queued`, flipped to `sent`/`failed` as each is processed. Anything left `queued` is visibly unfinished instead of invisibly lost.

No schema changes, no cron changes in this step, no backfill run.

## Verification before any backfill

After deploying, run the sync in **dry-run** mode for week `2026-08-03` and report back:

- The full list of students the function considers eligible for that week (expect 50).
- Which of those already have a `sent` sync row, and which do not.
- A detailed walk-through of two named students (Hajra plus one other from the dropped tail): their lessons that week, the exact `homework_brief` text and subjects that would be sent, and whether they would receive a notification or be de-duplicated.

Nothing is sent to HeyCleo and no messages go out during this check — it only proves the backfill list would be correct.

## Later (not now)

Backfill of the missed week, the `missing_only` selector, and the reconciliation cron are deferred until you have confirmed the two sample students look right.
