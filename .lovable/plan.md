# Pull HeyCleo students and homework completion into the CRM

A read-only sync that fetches live-tuition students and their homework assignments from HeyCleo, stores them here, and shows them on an admin page.

## What gets built

**1. Storage tables** (new)
- `heycleo_students` — name, email, year group, education level, exam year/month, working and target grade, school, tutor ids, live-tuition start, source timestamps.
- `heycleo_homework_completion` — assignment title, subject, year group, assessment type, tutor, due date, status, started/completed flags, timestamps, marks awarded/available, percentage.
- `heycleo_sync_state` — remembers the last successful sync time per dataset so each run only pulls what changed.

Access: service role only (the sync function). Admins and owners get read access so the admin page can display the data. No one can write from the browser.

**2. Sync function** `heycleo-pull`
- Calls `https://vfhftrmneaizgdvngfwe.supabase.co/functions/v1/external-data-pull/{students|homework-completion}` with the `x-external-key` header.
- Starts from the stored `last_server_time`, pages through `next_cursor` until exhausted (limit 500 per page), upserts every row by its primary key, then saves the run's `server_time` back to `heycleo_sync_state`.
- Accepts `{ "resource": "students" | "homework-completion" | "all" }` so it can be triggered manually or on a schedule.
- Returns a per-resource count of rows pulled, and logs failures without wiping the stored cursor (a failed run just retries the same window next time).

**3. Secret**
- `HEYCLEO_PULL_KEY` — you paste the value HeyCleo gave you. I'll open the secure form.
- Base URL is stored as `HEYCLEO_PULL_URL` so it can change without a code edit.

**4. Schedules**
- Students: daily at 02:00 UTC.
- Homework completion: hourly.

**5. Admin page** `/admin/heycleo-data` (admins and owners only)
- Two tabs: Students and Homework Completion.
- Students tab: searchable list with name, email, year group, education level, exam year, target/working grade, last synced.
- Homework tab: searchable/filterable list (by student, subject, status) with title, subject, due date, status, started/completed, marks and percentage.
- Header shows last sync time per dataset and a "Sync now" button that invokes the function on demand.
- Linked from the sidebar under the existing admin section.

## Technical details

- New edge function `supabase/functions/heycleo-pull/index.ts`, `verify_jwt = false`, running with the service role; manual invocations from the admin page are gated by an admin/owner role check on the caller's JWT.
- Cron jobs created with `pg_cron` + `pg_net` via `run_sql` (contains project-specific URL and key, so not a migration).
- People are matched to CRM records on lowercased email only — HeyCleo user ids are not the same as CRM user ids. An index on `lower(email)` supports that.
- Nothing is ever pushed back to HeyCleo.

## Note

Because the CRM and HeyCleo now sit on different Supabase projects, the existing SSO and homework webhook integrations are untouched by this work.
