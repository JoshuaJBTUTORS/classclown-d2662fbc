# Daily tutor time-off vs lesson clash alert

A scheduled job runs every morning, checks that day's lessons against tutor time-off, and emails the admin team whenever a tutor is booked to teach during time off.

## What it does

1. Runs daily at 06:00 UK time.
2. Loads every lesson scheduled for today (status `scheduled`, not cancelled), with tutor and student names.
3. Loads every approved time-off request that overlaps today.
4. Flags any lesson whose tutor has an overlapping time-off window.
5. If there are clashes, sends one summary email to hannah@, britney@ and joshua@classbeyondacademy.io listing: tutor, lesson time, subject/title, students, and the time-off window and reason.
6. If there are no clashes, sends nothing and logs a clean run.

## Technical details

- New edge function `daily-timeoff-clash-check` (`verify_jwt = false`), using the service-role client and Resend, matching the existing `send-timeoff-notification` pattern (React Email template in `_templates/`, UK time formatting via `_shared/timezone-utils.ts`).
- Overlap rule: `lesson.start_time < timeoff.end_date AND lesson.end_time > timeoff.start_date`, on `time_off_requests.status = 'approved'` only.
- Recipients kept as a constant array at the top of the function so they are easy to edit later.
- Scheduling via `cron.schedule('daily-timeoff-clash-check', '0 5 * * *', ...)` calling the function with `net.http_post` (05:00 UTC = 06:00 London in summer).
- The function is idempotent and read-only against the database — safe to re-run manually for testing.
