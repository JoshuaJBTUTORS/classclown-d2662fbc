# Second contact on the parent profile

Add an optional second phone number and second email to each parent, so both contacts receive the same WhatsApp messages and emails the platform already sends.

## What changes for you

- The parent form (add and edit) gains two optional fields: "Second WhatsApp number" and "Second email".
- Every WhatsApp message that goes to a parent today also goes to the second number when one is saved: lesson reminders, pre-lesson prep, homework notifications and nudges, late notices, enrolment notices, review room reminders, school progress reminders.
- Every parent email of those same types is also copied to the second email address.
- Leaving the fields blank keeps behaviour exactly as it is today. No duplicate messages when the second number matches the main one.

## Technical detail

1. Migration: add `secondary_phone text` and `secondary_email text` (both nullable) to `public.parents`. No grant/RLS changes needed — existing table policies cover them.
2. Types/UI: extend `src/types/parent.ts`, `EditParentForm.tsx`, `AddParentOnlyForm.tsx` (and bulk import types/service so imports can carry the fields).
3. Edge functions — select the two new columns wherever the parent row is loaded, and send to both contacts, deduplicating identical values and skipping empty ones:
   - `send-lesson-reminder`, `send-pre-lesson-prep`, `send-homework-notification`, `homework-nudge-reminders`, `send-late-notification`, `send-enrollment-notification`, `send-review-room-reminder`, `send-school-progress-reminder`.
   - WhatsApp: send a second Wazzup message to the secondary number (same body) rather than one message with two recipients.
   - Email: add the secondary email to the recipient list of the same send.
4. Failure of a secondary send is logged but never fails the primary send.
