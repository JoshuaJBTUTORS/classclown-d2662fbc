# Fix: 11 Plus English Group (Monday 7pm, Yolanda)

## What's wrong (confirmed)
- **Monday 2 November is missing, and the system won't create it.** The weekly series keeps a note of how far it has already added lessons. That note says lessons exist up to **Mon 2 Nov**, but the last lesson that actually exists is **Mon 26 Oct**. Nothing was cancelled and nothing appears in the deletion record, so the 2 Nov lesson was either never saved or removed without being recorded.
- Because the overnight job trusts that note, it will carry on from **9 Nov** onwards. **2 Nov will be skipped for good** unless we fix it.
- It's not the tutor change: Yolanda is set as the series tutor and she is active. The time (7 to 8pm UK), the room and the 7 students are all correct.
- **The same problem affects 3 other series** that are still meant to be running: KS2 Maths Group (Mon, last lesson 3 Sep), GCSE Physics Group (last lesson 18 Sep) and a second KS2 Maths Group (last lesson 19 Aug). Their notes say "added up to 2/3 Nov", but they have had no lessons for weeks.
- Minor: Luther Iyiegbu and Lotanna Nevo have no status set. They are still added to lessons.

## Fix
1. Add the missing Monday 2 Nov 7pm lesson for 11 Plus English (Yolanda, same 7 students, room created as normal).
2. Change the overnight job so it checks the last lesson that actually exists instead of trusting the note, and fills any missing weeks. That stops a gap like this from happening again.
3. For the 3 other series, I won't add anything until you confirm they should still be running (they may have stopped on purpose). I'll list them for you.
4. Ask you whether Luther and Lotanna should be marked active.

## Technical notes
- Group db8336fe (original 6d1cbabd): instances_generated_until 2026-11-02 18:00Z, next_extension_date 2026-11-09, max child start 2026-10-26 19:00Z; no recurring_lesson_cancellations rows, no lesson_deletion_log rows.
- In `extend_recurring_lessons()`, start working_date at the later of next_extension_date and (max existing child UK date + interval) only if it is within the lookback window. Simplest form: working_date := LEAST(next_extension_date, max_child_uk_date + days_to_add) when max child is in the future or recent. ON CONFLICT already prevents duplicates. Keep the UK wall-clock build and Assessment Week exclusion.
- Insert 2 Nov via the same columns the job uses, then trigger LessonSpace room creation for it.
