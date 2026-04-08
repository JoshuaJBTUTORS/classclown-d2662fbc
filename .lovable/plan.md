

## Send Notification When Student Added/Removed from Lesson

### What we're doing

When a student is added to or removed from a lesson (via the edit lesson flow), we'll send that specific student a simple WhatsApp + email notification saying their lesson schedule has been updated, with a link to check classclowncrm.com. Only the affected student gets notified — not all students on the lesson. For recurring lessons, only one notification per student regardless of how many future instances are affected.

### Changes

**1. New Edge Function: `supabase/functions/send-enrollment-notification/index.ts`**

A lightweight edge function that:
- Accepts `{ studentIds: number[], action: 'added' | 'removed', lessonTitle: string }`
- Looks up each student's parent email/phone from the `students → parents` relationship
- Sends a simple email via Resend: "There has been an update to your lesson schedule. Please check classclowncrm.com to view the update."
- Sends the same message via WhatsApp (Wazzup) if parent has a phone number
- Uses the existing `whatsapp-service.ts` and `Resend` patterns already in the codebase
- One notification per student, no lesson details included

**2. New WhatsApp template in `supabase/functions/_shared/whatsapp-templates.ts`**

Add `enrollmentUpdate` template — a simple message:
> "Hi [parentName]! There has been an update to [childName]'s lesson schedule on Class Beyond. Please visit classclowncrm.com to view the latest changes."

**3. New email template: `supabase/functions/send-enrollment-notification/_templates/enrollment-update-email.tsx`**

Simple React Email template matching existing style — just says there's been an update, check the portal.

**4. Update `src/services/recurringLessonEditService.ts`**

After successfully updating student associations (both single lesson edit ~line 96-118 and future lessons edit ~line 269-313):
- Compare old student IDs vs new student IDs
- Identify added and removed students
- Call `supabase.functions.invoke('send-enrollment-notification', { body: { studentIds, action, lessonTitle } })`
- For recurring edits, send once per affected student (not per lesson instance)

### Technical notes

- The existing code already fetches `existingStudents` before changes (line 274-280 in recurringLessonEditService), so diffing is straightforward
- For single lesson edits (line 96-118), we'll add a similar diff before the delete/insert
- Edge function uses existing `RESEND_API_KEY`, `WAZZUP_API_KEY`, `WAZZUP_CHANNEL_ID` secrets
- No database changes needed

### Files

| File | Action |
|------|--------|
| `supabase/functions/send-enrollment-notification/index.ts` | Create — new edge function |
| `supabase/functions/send-enrollment-notification/_templates/enrollment-update-email.tsx` | Create — email template |
| `supabase/functions/_shared/whatsapp-templates.ts` | Edit — add `enrollmentUpdate` template |
| `src/services/recurringLessonEditService.ts` | Edit — trigger notifications after student changes |

