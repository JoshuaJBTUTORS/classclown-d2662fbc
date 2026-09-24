# Send reminders to students' own contact details too

## Goal
Students who have their own email/phone on their profile should also receive lesson reminders and homework reminders directly — today only parents receive them.

## Current behaviour (verified)
- `send-lesson-reminder`: sends to parent email/WhatsApp only; skips the student entirely if no parent email exists. Student's own email is only passed into the email template for display, never sent to.
- `homework-nudge-reminders`: parent contacts first (incl. secondary); student's own email/phone only used when no parent exists.

## Changes

### 1. Lesson reminders (`supabase/functions/send-lesson-reminder/index.ts`)
- For each active (non-excused) student, after sending to the parent contacts, also send to the student's own `email` and `phone`/`whatsapp_number` when present and different from the parent's.
- Use the same templates; student copy addressed to the student by first name.
- Reuse the existing per-day dedupe pattern so re-runs never double-send.
- Students with no parent are no longer skipped — their own contact details are used.

### 2. Homework reminders (`supabase/functions/homework-nudge-reminders/index.ts`)
- In addition to the parent message, send each child in the group their own message (addressed to them by name) when they have their own email/phone that differs from the parent's.
- Dedupe per student per day alongside the existing per-parent-group key.

### 3. Safety
- Skip obviously invalid phones (e.g. the known "+2250" record) via the existing `normalisePhone` checks.
- Trial/demo lessons remain excluded from homework reminders; lesson reminders already exclude trials (handled by `send-trial-lesson-reminder`).

## Verification
- Dry-run `homework-nudge-reminders` for the next Friday and confirm student-contact sends appear for students with their own details.
- Dry-run/log-check `send-lesson-reminder` output counts before enabling sends.
- No schema changes required.
