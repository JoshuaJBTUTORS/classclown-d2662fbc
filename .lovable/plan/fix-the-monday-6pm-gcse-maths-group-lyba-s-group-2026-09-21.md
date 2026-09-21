# Fix the Monday 6pm GCSE Maths Group (Lyba's group)

## What actually happened

This group started life as "KS3 Maths Group" with Abdul as teacher and Ahmad Musa and Aiden Patel on the register. Over the summer it was changed week by week to "GCSE Maths Group" with Lyba Samar and the current four students (Amelia, Daniel Zack, Dylan, Daniel Nwaekpe) — up to and including 14 September.

The problem is the automatic "keep the repeat going" job. Every few weeks it creates the next batch of sessions, and it copies the name, subject and register from the **original** master record of the series — not from how the lessons actually look now. (It does carry the current teacher across, which is why Lyba's name was still on them.) That master record was never updated, so every newly created future session came back as "KS3 Maths Group", KS3 Maths, with Ahmad and Aiden on the register and the current four students missing.

Checked directly: the master record for this series still reads "KS3 Maths Group" / KS3 Maths with Ahmad Musa and Aiden Patel on its register, and every session deleted this morning (21 Sep onwards) was stored with exactly that name and subject, while the 7 and 14 September sessions kept the corrected GCSE details.

That is what you saw today. Because it looked like an old KS3 lesson, it was deleted this morning using "this and all future lessons" — which removed today's session and every Monday after it through 21 December (14 sessions).

Fariha's Monday 6pm GCSE Foundation group with Deborah and Delaney is a completely separate group and was never touched; it is the only thing left in that slot right now.

## What I'll do

1. Update the master record for the series so it matches reality: GCSE Maths Group, GCSE Maths Higher, Lyba Samar, with Amelia, Daniel Zack, Dylan and Daniel Nwaekpe on the register. This is what stops the KS3 version coming back.
2. Clear the "stop this series from today" marker left by this morning's delete.
3. Recreate the 14 Monday 6pm sessions from today through 21 December with the correct name, subject, teacher and those four students.
4. Fix the auto-extend job so future sessions are copied from the most recent actual lesson in the series rather than the original master record. This prevents the same silent revert on every other group too.

Past lessons, attendance, homework and summaries are untouched.

## Technical notes

- Series parent `e210f52e-2d70-4254-8137-dc72de05a129`; reference child `45dcf55a-c7f3-4c7b-9860-b360a9ce7f06` (14 Sep).
- Update the parent's `title`, `subject`, `tutor_id` and its `lesson_students` rows; also refresh `recurring_lesson_groups.current_tutor_id` for the series.
- Delete `recurring_lesson_cancellations` row `ddea4bc5-7100-4b66-9354-9fc7a10038cf` (`cancelled_from = 2026-09-21`).
- Recreate instances for 21 Sep – 21 Dec with `is_recurring_instance = true`, `instance_date` set, and the four `lesson_students` rows each.
- Migration to `public.extend_recurring_lessons()`: source `title`, `description`, `subject`, `lesson_type`, tutor and the student roster from the latest past instance of the series (fall back to the parent when none exists), keeping the existing cancellation, tutor-active and conflict handling unchanged.
