# Rishab Krishnan — why his sessions stopped repeating

## What I found

Rishab currently has **no upcoming lessons at all**. His last three were 14 Sep (Economics), 17 Sep (Computer Science) and 19 Sep (Further Maths).

The cause is not a system fault. On **16 September at 11:48 and 11:49**, Hannah Murray used "delete this and all future" on both of Rishab's new repeating series:

- 1-1 A level Computer Science (Thursdays 8pm, Olli Glover) — stopped from 17 Sep onward
- 1-1 A level Economics (Mondays 8pm, Scott Renwick) — stopped from 21 Sep onward

That action writes a permanent stop marker on each series and caps it so the repeat job never generates again. Both series are now marked as retired, which is why nothing appeared this week.

Separately, his older series (Further Maths with Riddhi Dineshkumar, Economics and Computer Science with Iulian Dogarescu) were all stopped the same way back in late June / July, when he appears to have been moved onto new teachers. The 17 Sep Computer Science and 19 Sep Further Maths lessons were created as one-off sessions, not repeats.

## Before I fix anything

I need to know what Rishab's schedule should actually be now, because two of his recent lessons were one-offs with different teachers (Iulian for Computer Science, Fariha Muhith for Further Maths) than the repeating series.

## Proposed fix

1. Confirm the intended weekly schedule: which subjects, which teacher, which day and time each.
2. For each confirmed slot, remove the stop marker, reopen the series, and regenerate weekly sessions from this week forward (three months ahead), with Rishab on the register.
3. Leave all past lessons, attendance, homework and summaries untouched.
4. Verify afterwards that Rishab has the expected weekly sessions on the calendar and that a repeat run creates no duplicates.

## Technical details

- Series records: `recurring_lesson_groups` rows for parents `fa087187…` (CS) and `ac5dfb24…` (Economics) both have `next_extension_date` stamped to 2126 and matching `recurring_lesson_cancellations` rows with `cancelled_from` 2026-09-17 and 2026-09-21.
- Reopening means deleting those cancellation rows, resetting `next_extension_date` / `instances_generated_until`, then generating the missing weekly instances with `lesson_students` entries for student 371.
