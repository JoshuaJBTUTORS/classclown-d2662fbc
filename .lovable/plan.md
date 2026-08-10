# The 1-1 KS2 Maths ghost occurrences (ARIYAN Hussain)

## What this lesson actually is

- Series parent lesson: `35d7d3ca-afc7-41e7-9c3c-709e725a75c7` — "1-1 KS2 Maths", weekly on Sundays, student ARIYAN Hussain (id 102).
- The occurrence in the screenshot (22 Feb 2026, 12:00, Britney Lawrence) is child instance `e951a74c-d97f-4d42-82e9-6077c702d335`.
- Recurring group: `b7b63e59-3731-4bab-b894-d6ce01ce1006` ("KS2 1-1 Maths - weekly", pattern marked infinite), 61 instances generated, generated-until 2 Aug 2026, next extension date 25 Oct 2026.

## What the data shows

Instances run weekly up to **29 March 2026**. Then there is a gap with no lessons from 5 April to 5 July 2026 — consistent with the series having been stopped/deleted.

Then three instances reappear: **12, 19 and 26 July 2026**, all with `created_at = 27 July 2026 01:00` — i.e. created by the nightly `extend_recurring_lessons()` job, not by a person. Those are the ghosts.

On 28 July someone deleted from-date-onwards twice, writing two cutoff rows on the series (`cancelled_from` 2026-08-09 and 2026-08-02). Those cutoffs only block dates from 2 Aug onwards; the already-generated 12/19/26 July rows were left behind, and the group row itself was never retired — it is still scheduled to run again on 25 Oct 2026.

Root cause is the known one: the generator recreates dates from the group whenever no cancellation covers them, and deleting lessons in April never wrote a cutoff for that period.

## Fix for this series

1. Delete the three ghost instances (12, 19, 26 July 2026) for this parent.
2. Retire the group: set its next extension far in the future (or remove the group) so 25 Oct cannot regenerate anything.
3. Replace the two overlapping cutoff rows with a single `cancelled_from` at the real end of the series (30 March 2026), so nothing between April and August can ever be regenerated either.
4. Re-run the extension function and confirm no new rows appear for this parent.

## Same problem elsewhere

Run the same audit across all groups: any group whose series has a long gap of deleted lessons but no matching cancellation cutoff will keep producing ghosts. Report the list first, then apply the same retire-and-cutoff cleanup as a reviewed data change.

## Technical notes

- Cleanup is a data change on `lessons`, `recurring_lesson_groups` and `recurring_lesson_cancellations` — no schema change needed for this specific series.
- The durable fix (guarding `extend_recurring_lessons()` with an "empty/ended series" and two-week lookback rule) is the previously drafted work; this plan can stop at the data cleanup if you only want the one series sorted now.
