# Fix: 11 Plus English Group (Monday 7pm, Yolanda)

## What's wrong
- **No lessons after Mon 26 Oct.** The weekly series (started 11 Aug, no end date) has nothing on Mon 2 Nov or any later Monday. Nothing was deleted (deletion log is empty), so the overnight job that adds new weeks has stopped adding this series.
- **Two students have a blank status:** Luther Iyiegbu and Lotanna Nevo. They are still on every lesson, but may be left out of reminders and reports.
- The rest looks fine: 7pm to 8pm UK every week (the clock change didn't affect it), Yolanda has been the tutor since 12 Oct, the room link is there, and the same 7 students are on each lesson.

## Proposed fix (nothing changes until you approve)
1. Find out why the overnight job skips this series (most likely because the tutor changed from Hassan to Yolanda partway through, or because of how the first lesson is set up) and fix the cause so it doesn't happen again.
2. Add the missing Monday 7pm lessons from 2 Nov onwards with Yolanda, the same room and the same 7 students, built from UK time.
3. Check that no other weekly series has stopped in the same way, and list any that have.
4. Ask you whether Luther and Lotanna should be marked active or removed from the group.

## Technical notes
- Series parent 6d1cbabd-11c7-4d3b-aca1-ffbe226bf3ea; last instance 43584515 (26 Oct). Review `extend_recurring_lessons()` for the skip condition. Follow the UK wall-clock rule and never use an Assessment Week lesson as the template.
