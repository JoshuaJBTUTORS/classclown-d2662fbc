# Fix lessons shifted by the clock change (25 Oct 2026)

## What I found
UK clocks went back an hour today. I compared every weekly series' UK time in the fortnight before the change with its UK time from today onwards (12 Oct to 8 Nov).

- About 30 series now show **one hour earlier** from 25 Oct onwards. For example: A-Level Maths Thu 7pm becomes 6pm, GCSE Biology Group Mon 6pm becomes 5pm, GCSE Chemistry Group Thu 6pm becomes 5pm, KS3 Science Group Mon 6pm becomes 5pm, SATS English/Maths Groups 4:30pm become 3:30pm, plus many 1-1 sessions (Combined Science, English, Maths, Year 11 sessions).
- One series (1-1 A Level Further Maths, Mon) went the other way, 7pm becomes 8pm.
- Most other series kept the right UK time, so the problem is limited to lessons created a certain way.
- A few rows also changed weekday (e.g. GCSE English Sun 10am vs Sat 9am, Year 11 Maths Sat 4pm vs Mon 8pm). These look like the older weekday-drift issue or genuine reschedules, not the clock change, and are reported separately.

## Why
The affected future lessons were created between July and October (during summer time) by copying the series' start time as a fixed "universal time" and adding whole weeks. That keeps the summer offset, so after the clocks go back each lesson lands an hour early in UK time. The correct method keeps the UK time of day (e.g. always 6pm London) and works out the universal time separately for each date. Before changing code I'll confirm which of the creators did this (the in-app "create recurring lesson / add student to all future lessons" code, the overnight top-up job, or both), since the affected rows came from several dates.

## Plan
1. **Audit list** - produce the full list of future lessons whose UK time differs from their series' normal UK time by exactly one hour, with tutor, students and old/new time, for you to check before anything changes.
2. **Correct the data** - move only those lessons back to their series' normal UK time (e.g. back to 6pm). Lessons with weekday changes or other odd differences are listed, not touched.
3. **Fix the cause** - make every place that creates repeat lessons keep the UK clock time across clock changes (including the "all future lessons" edit, which has the known timezone bug).
4. **Protect March** - check that lessons already generated past 29 March 2027 (clocks go forward) won't shift the other way, and fix them in the same pass.
5. **Check** - rerun the comparison so every series shows the same UK time before and after 25 Oct, and confirm on the calendar.

## Technical notes
- Detection: compare `to_char(start_time at time zone 'Europe/London','Dy HH24:MI')` per series (`coalesce(parent_lesson_id,id)`) across the 25 Oct boundary; target only exact 60-minute differences on the same weekday; shift both `start_time` and `end_time`.
- Generators to fix: `extend_recurring_lessons()` (build timestamps as `(date + local_time) at time zone 'Europe/London'`), `generateNextBatchOfInstances` and the edit-future-lessons path (use `fromZonedTime` with Europe/London, not `+7 days` in UTC or browser time).
- Assessment Week lessons excluded from templates, as already required.
