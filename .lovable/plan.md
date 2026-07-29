## What I found

Scanning the calendar for the week starting Monday 27 July 2026, there are 7 active lessons whose title contains "Group" but which are marked as non-group:

| Lesson | Day this week | Future occurrences also wrong |
| --- | --- | --- |
| 11 Plus Maths Group | Tue 28 Jul | 8 |
| KS2 Maths Group | Wed 29 Jul | 4 |
| SATS English Group | Wed 29 Jul | 12 |
| Year 11 Foundation Maths Group | Thu 30 Jul | 4 |
| GCSE Maths Group | Fri 31 Jul | 12 |
| KS3 English Group | Fri 31 Jul | 11 |
| GCSE Maths Group | Sun 2 Aug | 11 |

Each of these is a recurring instance, and in every case the parent recurring lesson is also marked non-group — which is why the whole series is wrong and why newly generated instances would keep coming back as non-group.

## Changes to make

1. **Update the 7 parent recurring lessons** to `is_group = true`, so the series definition is correct and any future instances generated from it inherit the group flag.
2. **Update all their instances dated Monday 27 July 2026 onwards** to `is_group = true` (this week's occurrence plus every future occurrence). Past occurrences are left untouched so historical records stay as they were.
3. Cancelled lessons are excluded from the update.

## Technical details

- Single data update against `lessons`: set `is_group = true` where the row is one of the 7 identified parent lessons, or has `parent_lesson_id` in that set and `start_time >= 2026-07-27`, with `cancelled_at IS NULL`.
- Scope is limited to those specific series IDs rather than a blanket title match, so nothing unexpected gets flipped.
- After applying, I'll re-run the scan query to confirm zero remaining "Group"-titled lessons with `is_group = false` from 27 July onwards.
