

## Backfill 3 Homework Assignments to HeyCleo for Serena Oyetunji

### What we're doing

Sending the last 3 KS2 English homework assignments to HeyCleo for Serena Oyetunji (student 173, parent: castrolbecky2002@yahoo.com). These were assigned before the exception was added, so they were never synced to HeyCleo.

### The 3 homework pieces

| # | Title | Due Date | Tutor | Attachment |
|---|-------|----------|-------|------------|
| 1 | Report Planning | Apr 3 | Bella Smith | btbqbarv3gk.pdf |
| 2 | Reading comprehension | Mar 28 | Daniel Alake | 6lhmbyydl3q.pdf |
| 3 | Nouns & Verbs HW | Mar 21 | Olli Glover | fcy5e6tpu97.pdf |

### Important note

These are **group lessons** with 4+ students, but we only want to sync to HeyCleo for **Serena's parent email** (`castrolbecky2002@yahoo.com`). The other KS2 students in the group should NOT be affected.

### How

Create a one-off edge function (`backfill-heycleo-homework`) that:

1. Calls the same HeyCleo endpoint (`receive-homework-from-crm`) used by the existing `send-homework-notification` function
2. Sends each of the 3 homework items with:
   - `studentEmails`: only `['castrolbecky2002@yahoo.com']` (parent email, since Serena has no student email)
   - `pdfUrl`: the attachment URL
   - `title`, `description`, `subject` ("KS2 English"), `dueDate`
   - A valid HMAC token using the tutor's email and `HEYCLEO_CROSS_PLATFORM_SECRET`
3. After successful execution, the function can be deleted

### Technical details

- Reuses the same `generateCrossPlatformToken` HMAC logic from `send-homework-notification`
- Sends to `https://vfhftrmneaizgdvngfwe.supabase.co/functions/v1/receive-homework-from-crm`
- No database changes needed
- No notifications (email/WhatsApp) will be sent — just the HeyCleo sync

### Files

| File | Action |
|------|--------|
| `supabase/functions/backfill-heycleo-homework/index.ts` | Create one-off edge function |

After running it once, we'll delete the function.

