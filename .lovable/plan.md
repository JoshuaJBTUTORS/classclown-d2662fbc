# Deletion history and recurring-series data clean

## What we actually store today

There is no deletion log. The only record of a deletion is a row in `recurring_lesson_cancellations`, and only for two of the three delete choices:

- **This lesson only** — writes a single `cancelled_date` row (only when the lesson belongs to a series).
- **This and all future occurrences** — writes a `cancelled_from` cutoff row, and stamps the recurring group so it stops extending.
- **Entire series** — writes nothing; it deletes the group row and even deletes the existing cancellation rows for that series. No trace remains.

Current data: 328 cancellation rows (194 cutoffs, 134 single dates), earliest 23 June 2026. Anything deleted before that date left no record at all.

## What the audit found

Across 445 recurring groups:

- 371 have no future lessons left.
- 195 of those have no cutoff recorded — nothing states the series ended.
- 140 groups are still "live" (extension date in the near future) despite having zero future lessons; 45 of those also have no cutoff at all. These are the ghost generators.
- 111 groups have had no lesson for over 30 days yet are still scheduled to extend. Oldest last lesson: 19 Sept 2025.
- 15 series carry more than one overlapping cutoff row.

## The clean-up

1. **Produce the audit list first** — every group with no future lessons, its last real lesson date, whether a cutoff exists, and its next extension date. Reviewed before anything is changed.
2. **Retire dead groups** — for the 140 live-but-empty groups, push `next_extension_date` 100 years out and mark them non-infinite so the nightly job can never regenerate them.
3. **Backfill a cutoff** for every retired series that has none, set to the day after its last real lesson, so even a manual re-run cannot recreate the gap.
4. **Collapse duplicate cutoffs** — where a series has several, keep the earliest and remove the rest.
5. **Re-run the extension function** and confirm no new lessons appear for any retired series.

## Keeping a record going forward

Add a lightweight `lesson_deletion_log` table capturing: the lesson id and title, tutor, student ids, start time, the scope used, who deleted it, when, and how many rows went. `delete_lesson_scoped` writes one row per deletion, including the "entire series" case that currently records nothing. This gives a permanent, queryable history of every deletion instead of inferring it from cancellations.

## Technical notes

- Cleanup is a reviewed data change on `recurring_lesson_groups` and `recurring_lesson_cancellations`; no lessons are deleted by it.
- New table plus an update to `public.delete_lesson_scoped` to insert the log row before the deletes; log is admin/owner readable only.
