# Fix duplicate and stale-tutor calendar sessions

## Confirmed findings

- **Lyba / Hajra:** Monday 17 August at 11:00 has three rows: one English lesson and two identical Maths rows. The Maths duplicates continue across future Mondays.
- **Scott / Edward:** Monday 17 August at 18:00 has three Scott sessions; Edward appears in the English group and in two identical copies of his 1-to-1 Maths lesson.
- **Yolanda:** the 11 Plus English group at 19:00 has two identical rows, repeated across future weeks.
- **Selena:** Thursday 20 August at 17:00 is assigned to Selena even though her tutor record is inactive. Ten more Selena sessions are already generated after that date.
- Across the database there are **32 future duplicate slots affecting 3 recurring series**.
- The daily cron still calls the older `generate-recurring-lessons` edge function. That function bulk-inserts future lessons without checking cancellations, inactive tutors, or whether that parent/date already exists. It generated the reported duplicates and stale-tutor rows on 10–12 August. The newer database generator has better checks, but no database uniqueness rule currently prevents duplicate creation.

## Fix

1. **Make one generator authoritative**
   - Retire the old edge-function generation path and point the daily job at the guarded database generator only.
   - Process only infinite, active series and prevent overlapping runs with a database lock.

2. **Make duplicate creation impossible**
   - Add a database uniqueness rule allowing only one recurring instance per parent series and start time.
   - Make generation conflict-safe, preserve Europe/London weekday/time, and consistently set recurring-instance metadata.

3. **Handle tutor changes correctly**
   - Never fall back to an inactive original tutor.
   - Require a continuing series to have an active authoritative tutor; otherwise stop extension and flag it for reassignment.
   - When a series tutor changes, update the authoritative tutor and future instances together so previously generated rows do not remain under the old tutor.

4. **Clean the current calendar**
   - Remove only the later duplicate copy from all 32 confirmed future duplicate slots, retaining the oldest canonical lesson and its related data.
   - Audit all future rows assigned to inactive tutors. Reassign rows only where the series already establishes a valid active replacement; otherwise stop the series and remove the invalid future rows rather than guessing a tutor.
   - Specifically verify Lyba/Hajra, Scott/Edward, Yolanda, and Selena on 17–20 August after cleanup.

5. **Regression checks**
   - Run the generator twice and confirm the second run creates zero rows.
   - Confirm there are zero future duplicate parent/start-time pairs and zero future lessons assigned to inactive tutors.
   - Verify the calendar shows one expected session per series in Europe/London time.

## Technical details

- Update `public.extend_recurring_lessons()` and recurring-series indexes in a migration.
- Replace the cron command invoking `generate-recurring-lessons`, then decommission that edge function after the guarded path is live.
- Use the existing lesson deletion audit and related-data cleanup pattern when removing duplicates or invalid future lessons.