# Stop ghost sessions for inactive tutors and stopped students

## What is actually happening

The nightly `extend_recurring_lessons()` job rolls every recurring series forward 3 months at a time. It only stops when someone writes a `recurring_lesson_cancellations` row with a `cancelled_from` date. It does not look at:

- the tutor's status (an `inactive` tutor keeps getting new lessons),
- the students' status (a stopped student keeps getting new lessons),
- whether the parent lesson still has any students attached at all.

Confirmed in the data right now:

- 729 future non-cancelled lessons overall.
- 24 future lessons belong to Harshini Virwani, whose tutor record is `inactive` (running to 27 Oct 2026).
- 250 future lessons include at least one student whose status is not active/trial.
- Several recurring groups have a parent lesson with zero students attached, yet still extend and create empty sessions.
- Faruq Orunsolu exists twice in `students` (id 240 `trial`, id 242 `active`); his English series ran on Liberty Fowler, who is `inactive`. Marking a student or tutor as gone never touched the series.

Also relevant: student status is not a reliable "stopped" flag today — 436 `trial`, 276 `active`, 162 blank, only 6 `inactive`. There is no "stopped/left" status, so nothing in the system currently represents "this client has ended".

## Fix

**1. Make the generator refuse to extend dead series**

Update `extend_recurring_lessons()` to skip a group when any of these is true:
- the parent lesson's tutor is not `active`,
- the parent lesson has no rows in `lesson_students`,
- every student on the parent lesson has status `inactive` (or a new `stopped` status).

When a series is skipped for one of these reasons, stamp the group so it stops being reconsidered every night.

**2. Add a real "stopped" state for students**

Add `stopped` to the student status vocabulary and a "Stop lessons" action on the student record that:
- sets the student status,
- writes `cancelled_from = today` on every recurring series that student is on,
- deletes their future scheduled lessons (and the lesson row entirely if they were the only student).

**3. Same for tutors**

When a tutor is set to `inactive`, prompt with the count of their future lessons and offer to cancel the series / reassign, instead of silently leaving them on the calendar.

**4. One-off cleanup**

Audit and remove the existing backlog:
- future lessons for inactive tutors (24 today),
- future lessons where no attached student is active,
- future lessons with no students attached,
- merge the duplicate Faruq Orunsolu records (240 / 242) onto one student id.

This runs as a reviewed data change, listing what will be removed before it is applied.

## Technical notes

- Migration rewrites `public.extend_recurring_lessons()` with the three guard clauses plus a `next_extension_date` far-future stamp for skipped groups.
- The existing duplicate guard inside the function matches on `title = lesson_record.title` as a fallback; that is what previously resurrected deleted lessons. Tighten it to `parent_lesson_id` / `id` only, now that `parent_lesson_id` is populated.
- Frontend touch points: student detail page (stop action), `src/pages/Tutors.tsx` (deactivate prompt), and `src/services/lessonDeletionService.ts` for the shared cancel-series helper.
