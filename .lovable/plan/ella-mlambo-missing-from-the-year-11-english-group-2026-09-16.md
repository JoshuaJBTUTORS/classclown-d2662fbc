# Ella Mlambo missing from the Year 11 English group

## What I found

Ella Mlambo (Year 11, active) is correctly in the Maths, Combined Science and Computer Science groups from next week, but not English:

- Year 11 Maths and Year 11 Combined Science: she was added to the whole future run of lessons, so she keeps showing.
- Year 11 English (Tuesdays 17:00): she was only added to the single lesson on 8 September. Every later Tuesday English lesson (15 Sep onwards, through 3 November) has the same five other students but not Ella.
- GCSE Computer Science: already corrected manually, so no changes are needed there.

Nothing was cancelled or deleted. The English change was applied to one date at a time instead of the whole repeating series.

## Why those lessons aren't marked as repeats

The single/all-future choice only appears when a lesson is marked as part of a repeating series. On 10 August at 14:50 the automatic job that creates future weekly lessons ran one time with a faulty version that forgot to stamp the "this is a repeat" marker. In that single run it created 51 lessons across 12 groups, including the whole Tuesday English run from 8 September onwards. The job was corrected the same afternoon, so lessons created since then are fine, but those 51 (44 still upcoming) stayed unmarked and behave like one-off lessons.

## Fix

1. Stamp the repeat marker back onto the affected lessons that belong to a repeating series, so the single/all-future choice appears again (including Ella's English group).
2. Add Ella to every future Tuesday Year 11 English lesson (22 September onwards), matching how Maths and Science were done.
3. Leave past lessons untouched so attendance and history stay accurate.
4. Make the repeat detection more forgiving so a lesson that sits inside a series always offers the choice, even if the marker is ever missing again.

## Technical notes

- Cause: migration `20260810144459` replaced `extend_recurring_lessons()` with an INSERT that omitted `is_recurring_instance` and `instance_date`; superseded later that day. All 51 defective rows share `created_at = 2026-08-10 14:50`.
- Repair migration: set `is_recurring_instance = true` and `instance_date = (start_time AT TIME ZONE 'Europe/London')::date` where `parent_lesson_id IS NOT NULL` and the flag is false.
- English series parent `fec86057-b788-418e-b748-8d47b3b42a26`: instances run to 2026-11-03; Ella linked only to the 2026-09-08 instance (`56ca608e`).
- `EditLessonForm` gates the scope selector on `is_recurring || is_recurring_instance`; add `parent_lesson_id != null` as the durable guard.
- Enrolment lives in `lesson_students`; data fixes touch future `lessons` rows only.
