# Fix "Failed to load lessons" on the calendar

## What's actually happening

The calendar isn't broken — it's timing out. I ran the exact request the calendar page makes and got back a database timeout (the database gave up after 5 seconds and returned an error, which the page shows as "Failed to load lessons").

The reason: there are 11,800 lessons and the database has no shortcut for looking them up **by date**. Every calendar view has to sift the whole lesson list to find the week or month you're looking at. Measured just now, that single step takes around 0.8-3.4 seconds before anything else happens. Add the tutor and student details the calendar pulls in alongside it, and busy moments tip it over the limit — which is why it fails sometimes and works other times.

A second, smaller drag: the student records have six separate overlapping access rules that each get checked for every student attached to every lesson on screen.

## The fix

1. **Add a date shortcut for lessons.** A proper index on lesson start time so the calendar jumps straight to the dates in view instead of scanning everything. This is the main fix and should take the load from seconds to milliseconds.
2. **Tidy the student access rules.** Merge the duplicate, overlapping read rules on student records into one, so the check runs once per row instead of six times.
3. **Stop the calendar asking for more than it needs.** It currently pulls every column of every lesson; narrow it to the fields the calendar actually displays.
4. **Make failures recoverable.** If the request does still time out, retry once automatically and show a "Retry" action on the message rather than leaving an empty calendar.

## Technical detail

- Migration: `CREATE INDEX CONCURRENTLY idx_lessons_start_time ON public.lessons (start_time);` plus `idx_lessons_start_time_type` on `(start_time, lesson_type)` if the lesson-type filter still shows in plans. No schema change, no data change.
- Confirmed by `EXPLAIN (ANALYZE)`: the range filter falls back to a bitmap scan of `idx_lessons_tutor_id_start_time` (leading column `tutor_id` unused), 759 ms index time, 3.4 s planning; the full PostgREST request returned `57014 canceling statement due to statement timeout`.
- `public.students` currently has 6 SELECT policies ("Parents can view their children", "...their own students", "...their students", students-own, tutors, admins). Collapse the three parent duplicates into one and keep admin/tutor/self as-is; no change in who can see what.
- `src/hooks/useCalendarData.ts`: replace `select('*', ...)` with an explicit column list in all four role branches; add one retry on Postgres error code `57014` and pass an `onRetry` action to the toast.

## Not doing

No changes to what the calendar shows, who can see which lessons, or any calendar behaviour.
