# Scott Renwick's Wednesday lessons: why they moved

## What I found

Scott's Wednesday 12 August column is full of sessions that do not belong on a Wednesday. Checked each affected series against its own bookings for August:

| Series | Correct day (still present, all Scott Renwick, students attached) | Extra rows added |
|---|---|---|
| 1-1 GCSE Maths | Mon 3, 10, 17, 24, 31 Aug 18:00 | Wed 12, 19, 26 Aug 18:00 |
| 1-1 KS2 English | Tue 4, 11, 18, 25 Aug 17:00 | Wed 12, 19, 26 Aug 17:00 |
| 1-1 KS2 Maths (RES) | Thu 13, 20, 27 Aug 18:00 | Wed 12, 19, 26 Aug 18:00, plus a stray Sun 9 Aug 10:00 |
| GCSE English Group (Tue) | Tue 4, 11, 18, 25 Aug 18:00 | Wed 12, 19, 26 Aug 18:00 — and 12 Aug exists **twice** |
| KS3 English Group (Wed) | Wed 18:00 as normal | duplicated rows on the same Wednesdays |

**Answer to your question: no, deleting the Wednesday rows will not leave gaps.** Every series still has its full run of correct-day sessions, all assigned to Scott Renwick, all with their students attached (1, 2, 2 and 6 students respectively). The Wednesday rows are pure additions created by the overnight `extend_recurring_lessons` job on 6–7 August — nobody moved anything, and none of today's changes are involved. Removing them restores each series to exactly its normal pattern.

The only genuine duplicate risk is the reverse case: GCSE English Group has two identical Wed 12 Aug 18:00 rows (one created 6 Aug, one 7 Aug), so the job ran twice and the duplicate guard failed to catch the second.


## Why it happened

The repeat-generation job does not use the lesson's own weekday. It starts from the bookkeeping field `next_extension_date` on the repeat rule and simply steps forward in 7-day jumps from that date, copying the lesson's time-of-day onto whatever weekday it lands on. The lesson's stored `recurrence_day` (monday, tuesday, thursday...) is never read.

Because `next_extension_date` is advanced by "3 months + 1 day" each time it runs, its weekday drifts on every cycle. On these series it had drifted to a Wednesday, so the batch generated on 6 August produced Wednesday sessions for Monday, Tuesday, Thursday and Friday series alike. The same drift explains earlier oddities in this data: KS2 Maths sitting on Sunday 9 Aug, KS2 English on Tuesday 19:00, A-Level Maths on a Sunday.

A second, smaller problem: the duplicate check only asks "is there already a lesson for this series on this date". That stops same-day doubles for most series but did not stop the two identical Wed 18:00 GCSE English rows, which needs a closer look before it is fixed.

## Proposed fix

1. **Clean the calendar now** — delete only the off-day rows created by the 6–7 Aug runs (Wed 12, 19, 26 Aug across the four non-Wednesday series, plus the stray Sun 9 Aug KS2 Maths), and de-duplicate the doubled Wednesday rows by keeping the older one. Correct-day sessions and their student lists are left untouched, so no session is lost and no tutor assignment changes.
2. **Anchor generation to the real weekday** — change `extend_recurring_lessons` so each new instance is placed on the series' own weekday (derived from the parent lesson's start time in UK time, with `recurrence_day` as a cross-check), instead of stepping from `next_extension_date`. Keep `next_extension_date` purely as a "how far ahead have we generated" marker.
3. **Harden the duplicate guard** — match on series + date + start time, and skip insertion if any row for the series already exists in that calendar week.
4. **Re-align existing repeat rules** — after the fix, sweep the drifted rules so their next generation lands on the correct weekday.
5. **Audit sweep** — list every future instance across all tutors whose weekday differs from its series' normal weekday, and report it before deleting anything, so nothing legitimate (a genuine one-off reschedule) is removed by mistake.

## Technical notes

- Function: `public.extend_recurring_lessons()` — the drift comes from `working_date := recurring_group.next_extension_date::DATE` at line 66 combined with `working_date := working_date + days_to_add` and the final `next_extension_date = extension_date + INTERVAL '1 day'`.
- Duplicate guard is the `NOT EXISTS ... DATE(start_time AT TIME ZONE 'Europe/London') = working_date` block.
- Cleanup will be done through the migration/data tools with the deleted rows logged to `lesson_deletion_log`.
