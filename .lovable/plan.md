# Ella Mlambo missing from English and Computer Science groups

## What I found

Ella Mlambo (Year 11, active) is correctly in two groups from next week, but not the other two:

- Year 11 Maths and Year 11 Combined Science: she was added to the whole future run of lessons (all weeks through December), so she keeps showing.
- Year 11 English (Tuesdays 17:00): she was only added to the single lesson on 8 September. Every later Tuesday English lesson (15 Sep onwards, through 3 November) has the same five other students but not Ella.
- GCSE Computer Science (Thursdays 17:00): she was added to just two single lessons, 10 and 17 September. This Thursday Computer Science run also has no lessons created at all after 17 September, so nobody appears in it next week.

So nothing was cancelled or deleted. The English and Computer Science changes were applied to one date at a time, and the Thursday Computer Science series has stopped generating future weeks.

## Why the English group gives no "single or all future" choice

That choice only appears when the lesson itself is marked as part of a repeating series. The 8 September Year 11 English lesson belongs to a repeating series but is not marked as a repeat, so the screen treats it as a one-off and hides the choice. 44 upcoming lessons across the calendar have this same mismatch, so the problem is not unique to Ella's English group.

## Fix

1. Repair the mismatch: mark upcoming lessons that belong to a repeating series as repeat lessons, so the single/all-future choice appears for them (including Ella's English group).
2. Add Ella to every future Tuesday Year 11 English lesson (22 September onwards), matching how Maths and Science were done.
3. Extend the Thursday GCSE Computer Science series past 17 September with the same tutor, time and group members, then add Ella to those lessons.
4. Leave past lessons untouched so attendance and history stay accurate.
5. Make the repeat detection more forgiving so a lesson that sits inside a series always offers the choice, even if the marker is missing.

## Technical notes

- English series parent `fec86057-b788-418e-b748-8d47b3b42a26`: instances run to 2026-11-03; Ella linked only to the 2026-09-08 instance (`56ca608e`), which has `parent_lesson_id` set but `is_recurring_instance = false`.
- `EditLessonForm` gates the scope selector on `is_recurring || is_recurring_instance`, hence the missing choice; add `parent_lesson_id != null` to that condition as the durable guard.
- Computer Science series parent `af621ecc-39ca-4855-b31d-b441bc545a83`: last generated instance 2026-09-17; backfill future instances and review the automatic series extension.
- Enrolment lives in `lesson_students`; data fixes touch future `lessons` rows only.
