## Plan: Stop Homework Reminders Completely

### Problem
The `heycleo-homework-webhook` edge function currently receives pings from HeyCleo for overdue homework and actively sends email and WhatsApp reminders to parents/students.

### Solution
Modify the webhook to return `200 OK` immediately with a "reminders disabled" response, skipping all email/WhatsApp sending logic. This:
- Prevents any reminder delivery
- Keeps HeyCleo's ping endpoint alive so their side doesn't error
- Is fully reversible if you ever want to turn reminders back on

### Changes
1. **Edge function**: `supabase/functions/heycleo-homework-webhook/index.ts`
   - Add an early return after secret validation that responds with `{ success: true, message: "Homework reminders are currently disabled" }`
   - All existing resolution/sending code stays intact but is skipped

### Out of scope
- Lesson reminders (trial, regular, review room) — these are separate cron jobs
- Proposal reminders (`send-daily-reminders`) — unrelated to homework
- HeyCleo SSO/homework navigation links in the UI

### Rollback
Reverting is a single edit: remove the early-return block and the original logic runs again.