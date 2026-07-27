Clear old assessment assignments so students only see the newly assigned ones in the Assessment Center.

## What to do

One-off data cleanup via the insert tool (SQL DELETE):

```sql
DELETE FROM public.assessment_assignments
WHERE created_at < '2026-07-27'::date;
```

This removes every assignment created on or before 26/07/2026 (anything from 27/07/2026 onward is preserved).

## Notes
- No schema or code changes — Assessment Center already lists whatever remains in `assessment_assignments` for the student/parent.
- This is destructive and cannot be undone. Confirm the cutoff date before I run it.
- Related rows in `assessment_sessions` / `student_responses` are keyed to `assessment_id` + `user_id`, not `assignment_id`, so past attempts/scores stay intact — only the assignment listing is cleared.