# Fix the Monday 7pm Year 11 Combined Science group

## What actually happened

The group has not been deleted. Every Monday session from 22 September onwards still exists, but they were rebuilt with the old details:

- Sessions up to 15 September: "Year 11 Combined Science Group" with Heavenly, Leke Falade, Aahil Khan and Zuriel Moses.
- Sessions from 22 September to 22 December: renamed back to "GCSE Combined Science Group" with only Leke Falade and Aqeela Krishnan.

Those future sessions were all created at 01:00 on 16 September by the automatic "keep the repeat going" job. At that time the job still copied the name, subject and register from the original 2025 master record of the series, which still says "GCSE Combined Science Group" with Leke and Aqeela. Yolanda stayed as the teacher because the teacher comes from the current group setup, not the old master.

This is the same fault we already fixed for Lyba's Maths group. The job itself has since been corrected to copy from the most recent real session, but these rows were generated before that fix, so they still carry the old details.

## The fix

1. Update the series master record so it matches the current group: title "Year 11 Combined Science Group", subject Year 11 Combined Science, Yolanda as teacher, and the four current students.
2. Correct every future session from 22 September to 22 December: restore the correct title and add Heavenly, Leke Falade, Aahil Khan and Zuriel Moses to the register (removing Aqeela, who is no longer in this group).
3. Leave all past sessions, attendance, homework and summaries untouched.
4. Run a check across all other repeating groups for future sessions created by the same job before the fix, and list any that came out with outdated names or registers so you can confirm before anything else is changed.

## Technical notes

- Series parent: `ff36f22d-9081-42dd-9626-014895bd7204`; affected children are the 14 rows created at `2026-09-16 01:00:00` with `start_time >= 2026-09-22`.
- Updates to `public.lessons` (title, subject) and `public.lesson_students` (roster sync) applied only to future rows.
- `public.extend_recurring_lessons()` already templates from the latest past instance, so no further function change is needed.
- Audit query compares each future instance created before 21 September against the most recent past instance of its series for title/subject/roster drift; results reported, no bulk changes without approval.
