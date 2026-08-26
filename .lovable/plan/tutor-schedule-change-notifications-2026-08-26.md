# Tutor schedule change notifications

Tutors get an email when they are added to a lesson or taken off one, mirroring the parent/student enrollment notification but email only, generic wording, and batched with a 30 minute cool down so a burst of calendar edits produces a single message.

## How it works

1. Any change to a lesson's tutor (new lesson, reassignment, lesson deleted or cancelled) is recorded automatically in the database, so it works no matter where the change came from: calendar dialog, recurring lesson edits, time off reassignment, Agent Cleo, or edge functions.
2. Each recorded change waits in a queue. A job runs every 10 minutes and, once a tutor has had no further changes for 30 minutes, sends that tutor one email covering everything that changed.
3. Wording stays generic and contains no hyphens, for example: "There have been updates to your teaching schedule on Class Beyond. Please sign in to view your latest sessions." No student names, no lesson titles.
4. Sends are logged so nothing is sent twice.

## Technical detail

**Database (migration)**

- `tutor_schedule_notifications` queue table: `tutor_id`, `lesson_id`, `change_type` (`added` / `removed`), `queued_at`, `sent_at`, `created_at`. Grants: `service_role` full access, `authenticated` select only; RLS with an admin/owner read policy via `has_role`.
- Trigger function `queue_tutor_schedule_change()` (security definer) on `public.lessons`:
  - INSERT with `tutor_id` not null → queue `added`.
  - UPDATE where `tutor_id` changed → queue `removed` for the old tutor and `added` for the new one; also queue `removed` when status changes to `cancelled`.
  - DELETE → queue `removed` for the tutor.
  - Skip rows whose `start_time` is in the past so historic cleanup does not spam tutors.

**Edge function `send-tutor-schedule-notification`**

- Selects unsent queue rows, groups by tutor, and skips any tutor whose most recent queued change is under 30 minutes old (that is the cool down).
- Looks up the tutor email from `tutors` / `profiles`, renders a React Email template (`_templates/tutor-schedule-update-email.tsx`) in the existing Class Beyond style, and sends from `Class Beyond <enquiries@classbeyondacademy.io>`.
- Counts of added and removed sessions are included, but no lesson or student identifying detail; all copy avoids hyphens.
- Marks the processed rows `sent_at`; rows for tutors with no email are marked sent with a logged skip so they do not accumulate.

**Schedule**

- `pg_cron` job `tutor-schedule-notifications` every 10 minutes calling the function via `net.http_post` (run through the SQL tool, not a migration, since it embeds the project URL and key).

**Testing**

- Dry run mode (`{ "dryRun": true }`) returns which tutors would be emailed and how many changes each covers, so we can verify before any live send.
