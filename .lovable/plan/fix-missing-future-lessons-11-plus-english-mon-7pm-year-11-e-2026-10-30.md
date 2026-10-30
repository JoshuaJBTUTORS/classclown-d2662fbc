# Fix: missing future lessons (11 Plus English Mon 7pm, Year 11 English Group Wed 7pm)

## What's wrong (confirmed)
Both lessons have the **same problem**. Their last lesson on the calendar is this week, and **next week's lesson is missing**:
- **11 Plus English Group (Yolanda, Mon 7pm):** last lesson Mon 26 Oct. **Mon 2 Nov is missing.**
- **Year 11 English Group (Hassan, Wed 7pm):** last lesson Wed 28 Oct. **Wed 4 Nov is missing.**

**Why:** each weekly series keeps a note of how far ahead lessons have already been added. For both series the note says "added up to 2 Nov", but those lessons don't exist. Nothing was cancelled or recorded as deleted. The overnight job trusts the note, so it will start again from 9 Nov. **The week of 2 Nov would be skipped for good.**

The tutor, the time (7pm UK), the room and the students are all correct on both. It isn't caused by the tutor change.

**The same thing affects 3 more series** that are still meant to run: KS2 Maths Group (Mon, last lesson 3 Sep), GCSE Physics Group (last lesson 18 Sep) and a second KS2 Maths Group (last lesson 19 Aug).

Not a problem: Oscar Wittey's 1-1 Year 11 English (Hassan, Wed) was stopped on purpose on 27 Oct. On 7 Oct it ran at the same time as the group lesson.

Minor: Luther Iyiegbu, Lotanna Nevo (11 Plus) and Aahil Khan (Year 11 English) have no status set. They are still added to lessons.

## Fix
1. Add the missing lessons: 11 Plus English Mon 2 Nov 7pm and Year 11 English Group Wed 4 Nov 7pm, with the same tutor, students and a new room each.
2. Change the overnight job so it starts from the last lesson that actually exists, not from the note. Any missing weeks then get filled automatically and this can't happen again.
3. Repair the note on every series where it's out of step.
4. I won't add anything to the 3 older series until you confirm they should still be running.
5. Ask you whether Luther, Lotanna and Aahil should be marked active.

## Technical notes
- Groups db8336fe (orig 6d1cbabd) and orig 15163580: instances_generated_until 2026-11-02 18:00Z, next_extension_date 2026-11-09, no recurring_lesson_cancellations, no lesson_deletion_log rows; updated_at frozen at 2026-08-15, so the bookmark was bulk-set outside the function.
- `extend_recurring_lessons()`: set working_date := LEAST(next_extension_date::date, max existing child UK date + 1) when the latest child is within the 14-day lookback; ON CONFLICT (parent_lesson_id, start_time) already prevents duplicates. Keep UK wall-clock build and Assessment Week exclusion.
- Insert the two lessons with the job's column set plus lesson_students from the latest instance, then call lesson-space-integration create-room for each.
