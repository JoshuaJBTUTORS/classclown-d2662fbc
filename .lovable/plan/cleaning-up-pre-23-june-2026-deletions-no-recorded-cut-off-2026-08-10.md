# Cleaning up pre-23 June 2026 deletions (no recorded cut-off)

## What the data shows now

- 445 recurring parent lessons in total; 269 of them have **no recorded cut-off date** (deleted or ended before the cancellation log existed, or never formally ended).
- Of those 269, **119 still have a live repeat rule** (able to generate new sessions in future).
  - 74 have genuine future sessions on the calendar (these look like active clients — leave alone).
  - 45 have **no future sessions at all** and their last session was in the past (many ended Nov 2025 – June 2026, three never had any sessions at all).
- Good news: there are currently **zero "gap" series** (no case where a series stopped months ago and then reappeared later), so nothing has visibly regenerated yet. The 45 dormant-but-live series are the ones that could pop back up.

## The approach

Since there is no deletion record for these, we infer "this series is finished" from the calendar itself, then retire it so it can never regenerate.

### Step 1 — Retire dormant series (safe, automatic)
For every recurring series that has **no live repeat rule needed**: no sessions today or later, and its last session was more than 30 days ago:
- Push the repeat rule 100 years out and mark it non-infinite.
- Write a cut-off record dated the day after the last real session, with reason "auto-retired: dormant series, no cut-off recorded".

This covers the 45 live dormant series plus any others that drift into that state. Nothing is deleted — only future generation is stopped.

### Step 2 — Series that never had any sessions
Three series have a live repeat rule but zero sessions ever. Retire them the same way, using their creation date as the cut-off.

### Step 3 — Review list for the borderline cases
Series that ended between 30 and 90 days ago could be a pause rather than an end. Produce a short list (client, subject, tutor, last session date) for you to confirm before retiring, rather than retiring silently. Anything older than 90 days is retired without review.

### Step 4 — Stop the problem recurring
- Add a nightly guard to the extension job: it refuses to generate a session for any series whose most recent session is more than 30 days in the past, and auto-retires that series instead.
- Add a deletion log so that from now on every deletion (single, future occurrences, entire series) is recorded with who, when and the scope — including entire-series wipes, which currently leave no trace.

## Technical notes

- Retirement = `recurring_lesson_groups.next_extension_date` set to 2100 and `is_infinite = false`, plus a `recurring_lesson_cancellations` row carrying `cancelled_from`.
- Dormancy is derived from `lessons.parent_lesson_id` / `start_time`; no reliance on the cancellation log, which only starts 23 June 2026.
- New table `lesson_deletion_log` (lesson id, series parent id, scope, deleted_by, deleted_at, snapshot of title/subject/tutor/time) written from the existing `delete_lesson_scoped` function.
- The extension guard goes into `extend_recurring_lessons()`.
