# Restore the Monday 6pm GCSE Maths Group

## What happened

The Monday 6pm group in your screenshot (Lyba Samar, 4 students: Amelia Joe, Daniel Zack, Dylan Adofo, Daniel Nwaekpe) is part of a repeating series that was originally set up as "KS3 Maths Group" with a different teacher.

Over time the individual weekly sessions were renamed to "GCSE Maths Group" and moved to Lyba, but the master record for the series still said "KS3 Maths Group". Today at 12:29 London, from your own account, that series was deleted using "this and all future lessons". That removed today's session and every Monday after it, through 21 December — 14 sessions in total. The 7 and 14 September sessions survive because they are in the past.

So nothing broke on its own: the delete was applied to the master record that was still wearing the old KS3 name, which is why it looked like a different lesson.

## What I'll do

1. Recreate the 14 deleted Monday 6pm sessions, from today (21 Sep) through 21 Dec, copying the settings from the 14 September session: title "GCSE Maths Group", subject GCSE Maths Higher, teacher Lyba Samar, 6:00–7:00pm.
2. Re-attach the same four students to every restored session.
3. Clear the "stop this series from today" marker so the restored sessions don't get hidden again or wiped by the overnight repeat job.
4. Correct the master record for the series so its name, subject and teacher match what the sessions actually are (GCSE Maths Group, GCSE Maths Higher, Lyba Samar). This stops the same confusion happening next time someone edits or deletes the series.

Past sessions, attendance, homework and lesson summaries are left untouched.

## Technical notes

- Series parent: `e210f52e-2d70-4254-8137-dc72de05a129`; reference child `45dcf55a-c7f3-4c7b-9860-b360a9ce7f06` (14 Sep).
- Restore from `lesson_deletion_log` rows with `parent_lesson_id = e210f52e...` and `deleted_at = 2026-09-21 11:29:08`, reusing the original `lesson_id` values so any linked records still match; set `is_recurring_instance = true` and `instance_date`.
- Students 360, 383, 526, 544 inserted into `lesson_students` per restored lesson.
- Delete the `recurring_lesson_cancellations` row `ddea4bc5-7100-4b66-9354-9fc7a10038cf` (`cancelled_from = 2026-09-21`).
- Update the parent row's `title`, `subject` and `tutor_id` to match the children.
- All done with data statements; no schema change.
