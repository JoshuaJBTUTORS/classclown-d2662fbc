# Full scan: lessons generated with the stale-parent structure

I scanned every future recurring lesson and compared it against what that same series has actually been running for the last 8 weeks (weekday, UK start time, tutor). 42 future rows across 11 series do not match their own established pattern.

## What the scan found

**1. Wrong weekday (13 rows)**
- 1-1 GCSE Maths — established Monday 20:00, but every future row from 20 Aug to 29 Oct sits on Thursday (11 rows).
- KS2 Maths Group — established Tuesday 18:00, but 12 and 19 Aug sit on Wednesday 16:00.

**2. Wrong time on the right weekday (12 rows)**
- 1-1 A-Level Maths — established Saturday 12:00, all 11 future rows are 13:00.
- KS2 English Group — 13 Aug generated at 16:00 instead of 17:00.

**3. Clock-change drift after 25 October (7 rows)**
Times were stored as a fixed UTC offset instead of a fixed UK local time, so after the 25 Oct clock change these rows land an hour early: 1-1 GCSE Math (25 Oct, 26 Oct, 1 Nov), 11 Plus Math Group (25 Oct, 1 Nov), GCSE English Group (28 Oct), Jake 1-1 KS2 Maths/English (29 Oct), 1-1 GCSE Maths (29 Oct).

**4. Wrong tutor on a series with only one tutor recently (10 rows)**
- 11 Plus English Group — 21 Sep to 26 Oct (6 rows) reverted to an older tutor.
- KS3 English Group — 16, 23, 30 Oct (3 rows).
- 1-1 GCSE Math — 17 Aug (1 row).

All four categories share one cause: generation copied weekday, time and tutor from the original historical parent lesson rather than from the series' current schedule, and it kept a fixed UTC time across the clock change.

## Proposed correction

1. **Confirm before changing** — produce a per-row before/after list for the 42 rows and flag any that already have attendance, homework or a summary attached; those are treated as history and left alone.
2. **Backfill authoritative schedules** — set the current weekday, UK start/end time and tutor on each affected recurring rule from its real recent pattern (the same fields already added for the Scott Renwick fix).
3. **Move, don't delete** — shift each wrong-weekday and wrong-time row onto the correct UK slot, and correct the tutor on the 10 reverted rows, keeping every student enrolment. Delete only a row that would collide with a correct row already in the same week, logging it to `lesson_deletion_log`.
4. **Fix clock-change handling** — make generation compute each occurrence from UK local time so future dates stay at the same wall-clock time either side of the October and March changes, then re-align the 7 affected rows.
5. **Re-audit** — re-run this same scan and confirm zero mismatched future rows and exactly one lesson per series per week.

## Technical details

- Detection query: dominant (weekday, UK time, tutor) per series over the last 56 days of instances, compared against all future instances, excluding cancelled rows.
- Fixes applied via migration/data tools against `lessons` and `recurring_lesson_groups`; deletions logged to `lesson_deletion_log`.
- `extend_recurring_lessons()` updated to build each occurrence as `Europe/London` local time rather than adding fixed UTC intervals.
- Series with genuinely more than one tutor in the last 8 weeks are excluded from the tutor correction so real cover arrangements are not overwritten.
