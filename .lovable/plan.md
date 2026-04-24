# Review Room: Grouped Approval Flow

## Goal

When viewing the **Review Room** tab in `/trial-bookings`, all sessions booked by the same parent appear as a **single grouped row** with one approval action. Approving once will:

1. Find/create the student record for that parent's child
2. For each selected session in the group, add the student to the matching existing Review Room lesson on the calendar
3. Mark all the booking rows as `approved`
4. Send **one** combined email + WhatsApp message to the parent with the Lessonspace link and an "excited to see you" message listing all their booked sessions

Trial-lesson bookings (non-Review Room) keep the existing per-row flow.

---

## UX Changes (`src/pages/TrialBookings.tsx`)

When the **Review Room** tab is active, switch the table from one-row-per-booking to **one-row-per-parent-email**:

- **Columns**: Parent | Child | Contact | Sessions (count + expandable list of date/time chips) | Status (aggregate: Pending if any pending, else Approved/Rejected) | Actions
- **Expandable detail**: clicking the row reveals each session with its individual status + an "X" to reject just that one session
- **Bulk Approve button** (green tick icon) on the row: opens a new `ReviewRoomApprovalDialog`
- **Bulk Reject** (X icon): rejects all pending sessions in the group
- Day-tab filter (Sat 25 Apr / Sun 26 Apr / etc.) keeps working — when a day is selected, groups only include sessions on that day, but the bulk action still operates on all that parent's sessions for that day filter.

Trial Lessons tab is untouched.

## New Component: `ReviewRoomApprovalDialog.tsx`

Located at `src/components/trialBooking/ReviewRoomApprovalDialog.tsx`. Shows:
- Parent + child details, contact info, exam board / tier (from `message`)
- A checklist of all the parent's pending Review Room sessions (date + time), all checked by default — admin can uncheck to skip individual sessions
- "Approve & Notify" button

On confirm → calls a new service `approveReviewRoomBookings({ groupedBookings, sessionIds })`.

## New Service: `src/services/reviewRoomApprovalService.ts`

For the selected group:

1. **Resolve student**: lookup `students` by `email`. If none, create a standalone student (`account_type: 'trial'`, `parent_id: null`, name from `child_name`) — same pattern as `trialLessonService.ts`.

2. **For each selected booking**:
   - Find the matching lesson in `lessons` where `subject ILIKE '%review room%'` AND the lesson's start time matches the booking's `preferred_date` + `preferred_time` (matched against UK local wall-clock — sessions exist as recurring rows on every weekend slot).
   - Insert into `lesson_students` (lesson_id, student_id) — ignore if duplicate.
   - Update `trial_bookings` row: `status = 'approved'`, `approved_at`, `lesson_id`, `approved_by` (current user).

3. **Send one combined approval notification** by invoking a new edge function `send-review-room-approval` with:
   - parent + child name, email, phone
   - sessions array `[{date, time}]` (the ones approved)
   - the static Lessonspace link `https://www.thelessonspace.com/space/3b3388bf-7e1f-4276-9f37-de5b17053e84`

## New Edge Function: `supabase/functions/send-review-room-approval/index.ts`

Mirrors `send-trial-lesson-approval` structure:
- React Email template `_templates/review-room-approval-email.tsx` listing all sessions, the Lessonspace link button, and an excited welcome message ("We're so excited to see [child] in The Review Room…")
- Sends email via Resend from `enquiries@classbeyondacademy.io`
- Sends WhatsApp via existing `whatsappService` + a new template method `WhatsAppTemplates.reviewRoomApproval(parentName, childName, sessions, link)` added to `supabase/functions/_shared/whatsapp-templates.ts`

## Lesson-matching Logic (key detail)

Bookings store `preferred_date` (e.g. `2026-04-26`) and `preferred_time` as a wall-clock string (e.g. `10:00:00`). Calendar lessons are stored in UTC. We'll match by:

- Constructing a UK-local datetime from booking date+time
- Converting to UTC and finding the lesson with the same `start_time` AND `subject ILIKE '%review room%'`

If no matching lesson exists for a given session, we surface it as a per-row warning in the dialog and skip that one (still approve the others).

---

## Files

**New:**
- `src/components/trialBooking/ReviewRoomApprovalDialog.tsx`
- `src/services/reviewRoomApprovalService.ts`
- `supabase/functions/send-review-room-approval/index.ts`
- `supabase/functions/send-review-room-approval/_templates/review-room-approval-email.tsx`

**Edited:**
- `src/pages/TrialBookings.tsx` — grouped rendering for review_room tab + open new dialog
- `supabase/functions/_shared/whatsapp-templates.ts` — add `reviewRoomApproval` template

No DB migration required (existing `trial_bookings` columns cover everything).
