# Restore Scott Renwick's English and Maths series

## What the database confirms

- **1-1 KS2 English** is the Emaan and Inayah series with Scott Renwick. Its established current slot is **Tuesday at 5:00pm**. Correct rows exist on 21 and 28 July and 11, 18, 25 August and 1 September.
- The extra **Wednesday 5:00pm** rows from 12 August onward were generated from the stale original parent lesson, which still says Wednesday. Where a Tuesday already exists, the Wednesday is a duplicate; after 1 September, the generator created only Wednesdays and left the correct Tuesdays missing.
- The completed 4 August English lesson is an isolated Tuesday **8:00pm** record. It will be preserved as historical data rather than rewriting a completed lesson.
- **1-1 KS2 Maths** is the same two students with Scott Renwick. Its established slot is **Friday at 6:00pm**, confirmed on 10, 24 and 31 July.
- Its generated future run is currently on **Thursday at 6:00pm** from 13 August onward. The 29 October row also reverted to Sabrina Baxendell at 7:00pm because the old parent lesson still carries Sabrina's tutor and time.
- Therefore, deleting every wrong row would create gaps. The safe correction is to remove only same-week duplicates and move the remaining future rows onto their proper weekday, time and tutor.

## Planned correction

1. **Give recurring groups an authoritative current schedule** — store the active weekday, UK start/end time and tutor on the repeat rule so generation no longer depends on an old historical parent lesson.
2. **Fix English** — set its rule to Tuesday 5:00pm with Scott; delete and log Wednesday rows in weeks that already have the correct Tuesday; move later Wednesday-only rows to Tuesday 5:00pm so every week retains one lesson.
3. **Fix Maths** — set its rule to Friday 6:00pm with Scott; remove the stray Sunday 9 August row if it has no attendance or completed work, then move each future Thursday row to Friday 6:00pm. Correct the 29 October tutor from Sabrina to Scott.
4. **Keep enrolments intact** — preserve Emaan and Inayah on every retained or moved lesson and do not alter completed attendance/homework records.
5. **Update the generator** — make `extend_recurring_lessons()` use the recurring group's current schedule and tutor, while retaining the same-week duplicate guard and cancellation checks.
6. **Reactivate the Maths rule safely** — restore normal extension after its current 2126 retirement marker only after the rule points to Scott and Friday 6:00pm.
7. **Verify** — confirm exactly one English lesson each Tuesday at 5:00pm and one Maths lesson each Friday at 6:00pm, all with Scott and both students, with no Wednesday/Thursday duplicates in the corrected future range.

## Technical details

- Schema changes will be added to `public.recurring_lesson_groups`; existing RLS policies remain in force.
- Duplicate deletions will be written to `lesson_deletion_log` before removal.
- All date/time matching and updates will use `Europe/London` so the schedule remains correct across daylight-saving changes.
- A final read-only audit will compare series + calendar week to ensure the correction neither loses a week nor creates two lessons in one week.