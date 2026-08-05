# Only alert about a missing tutor when students are actually expected

Right now the tutor punctuality monitor emails Hannah and Britney whenever a tutor has not joined 5 minutes after the scheduled start, regardless of whether any student is expected in that room. Add a pre-check so no alert goes out when the whole group has been excused (or there are no students on the lesson at all).

## Rule

Before sending the "tutor not in lesson" email:

1. Load the students linked to the lesson.
2. Load any attendance rows already marked for that lesson.
3. Count students who are still expected: a student is expected unless their attendance for this lesson is already marked `excused` (also treat `absent` as not expected, since ops have already recorded the student is not coming).
4. If the expected count is zero, skip the email. Still write/refresh the punctuality record so the dashboard shows what happened, with a status that makes the reason obvious.

If nothing is marked at all (the usual case at lesson start), every enrolled student counts as expected and the alert behaves exactly as it does today.

## Dashboard

On the Live Lesson Tracker punctuality card, lessons that were skipped for this reason show a neutral badge ("No students expected") instead of looking like an unhandled late tutor.

## Technical notes

- File: `supabase/functions/tutor-punctuality-monitor/index.ts`.
- Fetch `lesson_students` (`lesson_id`, `student_id`) and `lesson_attendance` (`lesson_id`, `student_id`, `attendance_status`) in one batched query per run for the lessons in the current window, rather than per lesson, to keep the 5-minute cron cheap.
- Expected students = enrolled student ids minus those whose `attendance_status` is `excused` or `absent` (values confirmed present in the table: attended, absent, excused, late, scheduled).
- Gate only the Resend call on `expectedCount > 0`; the `tutor_punctuality` upsert still runs. Add `no_students_expected` as the stored `status` for those rows (the column is free text, so no migration is needed) and leave `alert_sent_at` null so a later alert can still fire if attendance changes.
- File: `src/pages/LiveSessions.tsx` — render the new status with a muted badge in the punctuality section.
