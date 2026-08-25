# Homework nudge reminders (Wednesday and Friday)

Two scheduled runs each week send a plain text nudge to families whose homework is outstanding.

## Who gets checked

For every active student, in order:

1. Do they have any lessons at all this week? If not, skip them entirely.
2. Is this week's homework complete? Is last week's homework complete?
3. Pick the single best message from the four below, or send nothing if everything is complete.

Homework status comes from the HeyCleo data we already pull hourly. This week means homework due in the current Monday to Sunday window, last week the previous one.

## Messages

Plain text only, no hyphens, no special characters.

Wednesday, this week not complete:
"Hello. This is a reminder that your child has X days left to complete this week's homework. Please log on to classclowncrm.com and head to HeyCleo to complete the homework."

Wednesday, this week not complete and last week not complete:
"Hello. This is a reminder that your child's homework due from last week has not yet been completed. Please note that failure to complete can result in restricted access from future lessons as this is a requirement to ensure we can best support your child."

Friday morning, this week not complete:
"Hello. This is just a reminder that your child's homework is due today. Please let us know if you are having difficulty completing this week's homework."

Friday morning, this week not complete and last week not complete:
"Hello. This is a reminder that your child has not yet completed this week and last week's homework. Please note that failure to complete homework can result in restricted access as this is a requirement to ensure we can best support your child."

## Sending rules

- Channels: WhatsApp and email, same plain text wording.
- Recipients: the parent's contact details, falling back to the student's own email and phone when there is no parent contact.
- One message per family per run. Re running the same day never double sends.
- If a student has no HeyCleo account linked, they are skipped.

## Schedule

- Wednesday 4pm UK time
- Friday 9am UK time

Both runs support a test mode that reports who would be messaged without sending anything, plus a manual run for a chosen date.

## Technical notes

- New edge function `supabase/functions/homework-nudge-reminders/index.ts`:
  - Body flags: `dry_run`, `as_of` (ISO date to simulate a run day), `student_ids`.
  - Eligibility: `lessons` rows for the student inside the current London week (any status other than cancelled).
  - HeyCleo linkage reuses the email matching logic already in `useHeyCleoHomeworkStatus` (student email, else parent email when that parent has a single child), resolved server side against `heycleo_students`.
  - Completion per week: any `heycleo_homework_completion` row with `due_date` inside the week window and `completed = false` means that week is outstanding; no rows for a week means nothing due, so treated as complete.
  - Days left on Wednesday is computed to the Friday deadline.
  - Sends via the shared `whatsappService` (`_shared/whatsapp-service.ts`) and Resend from `enquiries@classbeyondacademy.io` with a new React Email template in `homework-nudge-reminders/_templates/`, subject "Homework reminder".
  - Idempotency and logging use the existing `notifications` table, type `homework_nudge`, keyed by run date plus channel and contact, mirroring `weekly-homework-sync`.
  - 1 to 2 second spacing between sends to avoid rate limits.
- Two `pg_cron` jobs calling the function via `net.http_post`, created with the data tool so the URL and key are not committed: Wednesday 15:00 UTC and Friday 08:00 UTC, matching UK summer time (a note in the function keeps behaviour correct in winter by checking the London weekday and hour before acting).
- No schema changes.
