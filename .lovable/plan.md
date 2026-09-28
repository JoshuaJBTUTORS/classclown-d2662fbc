# Time-off clash check: cover the whole current week

The daily time-off clash check currently only looks at today's lessons. Change it so each daily run checks the whole current UK week (Monday to Sunday) instead.

## What changes

1. The check window becomes the current UK week: Monday 00:00 to the following Monday 00:00 (Europe/London), instead of a single day.
2. Every scheduled lesson in that window is compared against approved time-off requests that overlap the week, using the same overlap rule as now.
3. The email lists all clashes found for the week, grouped by day, so the team can see at a glance which days have problems.
4. The email subject and heading say "this week" with the week range (e.g. "Mon 28 Sep – Sun 4 Oct") instead of a single date.
5. If there are no clashes anywhere in the week, nothing is sent, as now.
6. The job keeps running daily at 06:00 UK time — no schedule change.

## Technical details

- Edit `supabase/functions/daily-timeoff-clash-check/index.ts` only: compute `weekStart` (UK Monday) and `weekEnd` (weekStart + 7 days) using the existing UK-time helpers, and use those for the lessons and time-off queries.
- Group clash rows by UK date in the email table (a day subheading row per day with clashes).
- Redeploy the function with `supabase--deploy_edge_functions` and dry-run it once to confirm the week's clashes are detected correctly.
