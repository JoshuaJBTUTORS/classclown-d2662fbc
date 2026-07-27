## Goal
Silence the per-lesson HeyCleo homework sync so that when a tutor completes a lesson and assigns homework, nothing is pushed to HeyCleo. Emails/WhatsApp to parents/students continue as normal, and the weekly `weekly-homework-sync` flow is untouched.

## Change

In `supabase/functions/send-homework-notification/index.ts`:

- Short-circuit the HeyCleo block around lines 357–397: skip the eligibility check and the `sendHomeworkToHeyCleo(...)` call entirely, and log `HeyCleo sync disabled (per-lesson sync silenced)`.
- Leave `heyCleoResult = { success: false, error: 'disabled' }` so the existing response shape (`heyCleoSync: false`) stays the same and no downstream callers break.
- Leave the `sendHomeworkToHeyCleo` helper and email-collection code in place but unused, so re-enabling later is a one-line change.

## Not changed
- Lesson completion flow, homework creation, email/WhatsApp notifications.
- `weekly-homework-sync` (the manual "Sync to HeyCleo" button on the student page keeps working).
- HeyCleo SSO and other integrations.

## Verify
Redeploy `send-homework-notification` and confirm in edge function logs that the next homework assignment logs `HeyCleo sync disabled` and no POST goes to `receive-homework-from-crm`.