# Silence per-lesson homework notifications

Homework assigned when completing a lesson currently triggers emails, WhatsApp messages and in-app notification records. Only the weekly Sunday homework release announcement should go out.

## What changes

- Assigning homework (from the lesson completion dialog or the homework dialog) no longer sends any email, WhatsApp message, or in-app notification.
- Homework is still saved and attached to the lesson exactly as today.
- The weekly homework release job (Sunday) is untouched and keeps sending its WhatsApp and email announcement.
- Success toasts change from "Homework assigned and notifications sent!" to simply confirming the homework was assigned.

## Technical notes

- `supabase/functions/send-homework-notification/index.ts`: make the handler a no-op that returns `{ success: true, skipped: 'notifications_disabled' }` immediately. The existing email/WhatsApp/notification-insert code stays in the file behind the early return so it can be re-enabled later.
- `src/components/lessons/CompleteSessionDialog.tsx` and `src/components/homework/AssignHomeworkDialog.tsx`: remove the `supabase.functions.invoke('send-homework-notification', ...)` calls and their notification-related toasts.
- No database or cron changes; `weekly-homework-sync` and its schedule are not modified.
