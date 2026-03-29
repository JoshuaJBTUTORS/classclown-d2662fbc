

## Fix: Lesson Times Showing 1 Hour Late After BST Clock Change

### The problem

Lessons created during GMT (winter) were stored as UTC — e.g. a 9am UK lesson = `09:00+00` UTC. Now that clocks went forward (BST), `convertUTCToUK` correctly shows `09:00 UTC` as `10:00 BST`. But the lesson was meant to always be at 9am UK time, so it now appears 1 hour late.

The DB `extend_recurring_lessons` function also copies the raw UTC time without DST adjustment, so all auto-generated future lessons inherit the same issue.

### The fix (two parts)

**Part 1 — One-time DB migration: shift future lessons back 1 hour**

Run a SQL migration to subtract 1 hour from all future lessons' `start_time` and `end_time`, so that a 9am UK lesson becomes `08:00 UTC` (which BST correctly displays as 9am).

```sql
UPDATE lessons
SET start_time = start_time - INTERVAL '1 hour',
    end_time = end_time - INTERVAL '1 hour'
WHERE start_time >= '2026-03-29T01:00:00+00'
  AND status != 'completed';
```

This only affects future, non-completed lessons. Past lessons that already happened at the old time are left as-is.

**Part 2 — Fix `extend_recurring_lessons()` DB function**

Update the function to be DST-aware when generating new lesson instances. Instead of:
```sql
working_date + (lesson_record.start_time::TIME)
```
Use timezone-aware conversion:
```sql
(working_date::date || ' ' || (lesson_record.start_time AT TIME ZONE 'Europe/London')::TIME)::timestamp AT TIME ZONE 'Europe/London'
```
This ensures that when new recurring instances are generated, the UK wall-clock time is preserved regardless of whether the date falls in GMT or BST.

### What stays the same

- The frontend `convertUTCToUK` / `convertUKToUTC` functions are correct and don't need changes
- The `AddLessonForm` and `EditLessonForm` already use `convertUKToUTC` properly
- The `formatInUKTime` display utility works correctly

### Risk

- The one-time migration only needs to run once. If run again after a future DST change (October clocks back), it would double-shift.
- We should verify the migration affects the right lessons by doing a SELECT count first.

