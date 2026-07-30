## Goal

Show total weekly tutoring hours on the Admin Dashboard, counted as **student-hours**: a 1-hour 1-to-1 lesson = 1 hour, a 1-hour group lesson with 3 students = 3 hours.

## Scope (confirmed)

- Week = current week, Monday 00:00 to Sunday 23:59 (local/London), independent of the month selector.
- Counts all non-cancelled scheduled lessons in that week, whether already taught or still upcoming.
- Trial lessons excluded (`lesson_type <> 'trial'`).

## Calculation

For each lesson in the week:
`lesson duration in hours (end_time - start_time) x number of enrolled students`
Sum across all lessons, round to 1 decimal.

Students come from `lesson_students`. Lessons with no linked students contribute 0. Cancelled lessons (`status = 'cancelled'` or `cancelled_at` set) are skipped.

## Changes

1. `src/services/adminDashboardService.ts`
   - Add `weeklyTutoringHours` and `weeklyLessonCount` to `AdminDashboardData`.
   - Compute the Mon-Sun window from "now" and fetch lessons in that range with their `lesson_students` rows in one nested select, filtering out trials and cancellations, then aggregate as above.
2. `src/pages/AdminDashboard.tsx`
   - Add a new card, "Weekly Tutoring Hours", with a clock icon, showing e.g. `126.5h` and a subtitle like "Student-hours delivered this week (Mon-Sun), N lessons".
   - Card sits alongside the existing metric cards in the same grid; note in the subtitle that this is always the current week.

## Technical notes

- No schema or migration changes; read-only query against `lessons` + `lesson_students`.
- Uses the same Supabase client pattern as the existing dashboard fetch, so it loads with the rest of the dashboard and refreshes with the Refresh button.
