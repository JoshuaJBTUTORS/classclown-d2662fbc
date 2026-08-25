# Show last week's homework completion on the calendar

Tutors opening a lesson in the calendar should immediately see, under each student, whether that student completed last week's HeyCleo homework — so they can nudge the ones who haven't.

## What the tutor sees

In the lesson dialog's Students section, each student row gains a small status chip:

- Green "HW done" — last week's homework completed
- Amber "HW started" — opened but not submitted
- Red "HW not started" — no attempt, past due
- Grey "No HW data" — student isn't matched to a HeyCleo account, or no homework was assigned for that week

Hovering/tapping the chip shows the homework title, due date and score (when marked). A one-line summary sits at the top of the Students card, e.g. "2 of 3 completed last week's homework".

"Last week" means the homework week that has already passed its due date (the most recent completed cycle), not the one currently in flight.

## Matching students to HeyCleo

HeyCleo records are keyed by email. We match in this order:

1. CRM student email matches a HeyCleo student email (142 of 163 HeyCleo students match this way today).
2. Otherwise, the student's parent email matches a HeyCleo account — used only when that parent has a single child, since a shared parent email cannot be attributed to a specific sibling.
3. No match: the row shows "No HW data".

## Access

The `heycleo_students` and `heycleo_homework_completion` tables are currently readable by admins and owners only. A migration will add read access for tutors so the chips render for them (tutors already see their own lessons' students). No other permissions change.

## Technical notes

- New hook `src/hooks/useHeyCleoHomeworkStatus.ts`: given a list of CRM student ids/emails, resolves HeyCleo student ids and returns, per CRM student, the most recent past-due homework row (`completed`, `started`, `due_date`, `title`, `marks_awarded`/`marks_available`). Cached via react-query, keyed on the student id set.
- New presentational component `src/components/lessons/HomeworkStatusChip.tsx`.
- `src/components/lessons/StudentAttendanceRow.tsx` renders the chip next to the student's name; `src/components/calendar/LessonDetailsDialog.tsx` calls the hook once for `validStudents` and passes each status down, plus the summary line in the Students card header.
- The matching/aggregation logic mirrors `src/hooks/useHeyCleoStudents.ts` and will reuse its row types.
- Supabase migration: add SELECT policies for the `tutor` role on both HeyCleo tables (plus the corresponding grants if not already present).
