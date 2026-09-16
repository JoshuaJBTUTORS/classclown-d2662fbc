# Ella Mlambo missing from English and Computer Science groups

## What I found

Ella Mlambo (Year 11, active) is correctly in two groups from next week, but not the other two:

- Year 11 Maths and Year 11 Combined Science: she was added to the whole future run of lessons (all weeks through December), so she keeps showing.
- Year 11 English (Tuesdays 17:00): she was only added to the single lesson on 8 September. Every later Tuesday English lesson (15 Sep onwards, through 3 November) has the same five other students but not Ella.
- GCSE Computer Science (Thursdays 17:00): she was added to just two single lessons, 10 and 17 September. On top of that, this Thursday Computer Science run has no lessons created at all after 17 September, so nobody appears in it next week.

So this is not a cancellation or a deletion. When she was added to English and Computer Science, the change was applied to one lesson at a time instead of to the whole repeating series, and the Thursday Computer Science series has also stopped generating future weeks.

## Fix

1. Add Ella to every future Tuesday Year 11 English lesson (from 22 September through the last one currently created), matching how Maths and Science were done.
2. Extend the Thursday GCSE Computer Science series so future weekly lessons exist beyond 17 September, keeping the same tutor, time and existing group members, then add Ella to each of those future lessons.
3. Leave past lessons untouched so attendance and history stay accurate.

## Preventing a repeat

When a student is added to a group lesson that repeats, the "all future lessons" option should be the default rather than adding them to one date. I will check the add-student flow on the lesson screen and make that the default choice, with the single-date option still available.

## Technical notes

- English series parent: `fec86057-b788-418e-b748-8d47b3b42a26`; instances exist to 2026-11-03, Ella only linked to the 2026-09-08 instance.
- Computer Science series parent: `af621ecc-39ca-4855-b31d-b441bc545a83`; last generated instance is 2026-09-17, so the automated extension of this series needs checking alongside backfilling instances.
- Enrolment lives in `lesson_students`; fixes are inserts against future `lessons` rows only.
