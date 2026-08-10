# Scott Renwick's Wednesday lessons: why they moved

## What I found

Scott's Wednesday 12 August column is full of sessions that do not belong on a Wednesday. Comparing each affected series against its own last 8 weeks of history:

| Series | Normal slot (last 2+ weeks) | What appeared | Created |
|---|---|---|---|
| 1-1 GCSE Maths | Mon 17:00 | extra Wed 12 & 19 Aug 17:00 | 6 Aug 01:01 |
| 1-1 KS2 English | Tue 16:00 | extra Wed 12 & 19 Aug 16:00 | 6 Aug 01:02 |
| 1-1 KS2 Maths | Fri 17:00 (and Thu 13/20 already generated) | extra Wed 12 & 19 Aug 17:00 | 6 Aug 01:01 |
| GCSE English Group (Tue) | Tue 17:00 | extra Wed 12 & 19 Aug 17:00 | 6 Aug 01:0x |
| GCSE English Group (Wed 18:00) | Wed 18:00 | duplicated — two identical rows on 12 Aug and on 19 Aug | 6 Aug 01:01 alongside 2 Jul row |

Every one of these rows was created by the overnight `extend_recurring_lessons` job in the early hours of 6 August. None were created by a person, and none of today's changes are involved. The correct Mon/Tue/Fri instances are still there — the Wednesday ones are additions, not moves.

## Why it happened

The repeat-generation job does not use the lesson's own weekday. It starts from the bookkeeping field `next_extension_date` on the repeat rule and simply steps forward in 7-day jumps from that date, copying the lesson's time-of-day onto whatever weekday it lands on. The lesson's stored `recurrence_day` (monday, tuesday, thursday...) is never read.

Because `next_extension_date` is advanced by "3 months + 1 day" each time it runs, its weekday drifts on every cycle. On these series it had drifted to a Wednesday, so the batch generated on 6 August produced Wednesday sessions for Monday, Tuesday, Thursday and Friday series alike. The same drift explains earlier oddities in this data: KS2 Maths sitting on Sunday 9 Aug, KS2 English on Tuesday 19:00, A-Level Maths on a Sunday.

A second, smaller problem: the duplicate check only asks "is there already a lesson for this series on this date". That stops same-day doubles for most series but did not stop the two identical Wed 18:00 GCSE English rows, which needs a closer look before it is fixed.

## Proposed fix

1. **Clean the calendar now** — delete the off-day instances created by the 6 August run for these series (Wed 12 and 19 Aug), plus the duplicated Wed 18:00 rows, leaving each series' correct day untouched.
2. **Anchor generation to the real weekday** — change `extend_recurring_lessons` so each new instance is placed on the series' own weekday (derived from the parent lesson's start time in UK time, with `recurrence_day` as a cross-check), instead of stepping from `next_extension_date`. Keep `next_extension_date` purely as a "how far ahead have we generated" marker.
3. **Harden the duplicate guard** — match on series + date + start time, and skip insertion if any row for the series already exists in that calendar week.
4. **Re-align existing repeat rules** — after the fix, sweep the drifted rules so their next generation lands on the correct weekday.
5. **Audit sweep** — list every future instance across all tutors whose weekday differs from its series' normal weekday, and report it before deleting anything, so nothing legitimate (a genuine one-off reschedule) is removed by mistake.

## Technical notes

- Function: `public.extend_recurring_lessons()` — the drift comes from `working_date := recurring_group.next_extension_date::DATE` at line 66 combined with `working_date := working_date + days_to_add` and the final `next_extension_date = extension_date + INTERVAL '1 day'`.
- Duplicate guard is the `NOT EXISTS ... DATE(start_time AT TIME ZONE 'Europe/London') = working_date` block.
- Cleanup will be done through the migration/data tools with the deleted rows logged to `lesson_deletion_log`.
