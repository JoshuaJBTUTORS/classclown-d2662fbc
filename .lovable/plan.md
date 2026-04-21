

## "Review Room" Weekend Booking Flow

A new public booking page for **Review Room** sessions, separate from the existing trial booking flow. Users pick any combination of fixed sessions across 4 weekend days, submit contact details, and bookings are saved + notifications fired.

### Fixed timetable

Same 3 sessions on each of the 4 days:

| Time | Subject |
|---|---|
| 10:00 | GCSE Maths |
| 12:00 | GCSE Science |
| 14:00 | GCSE English |

Dates: **Sat 25 Apr, Sun 26 Apr, Sat 2 May, Sun 3 May 2026**.

(Note: your message said "Sunday 25th" and "Sunday 2nd" — I'll assume these are typos for Sun 26 Apr and Sun 3 May based on the calendar.)

### User flow at `/review-room`

**Step 1 – Pick sessions**: 4 day cards (one per date). Each card lists the 3 time slots with checkboxes. User can tick any combination across days. A "Selected: N sessions" counter sits at the bottom.

**Step 2 – Contact info**: Same fields as `/book-trial` (parent name, child name, email, phone). Summary of selected sessions shown above the form.

**Step 3 – Submit**: Inserts one row per selected session into `trial_bookings` with `booking_source = 'review_room'`, then fires notifications.

**Step 4 – Confirmation**: Reuses existing `/trial-booking-confirmation` page.

### Notifications

- **Parent**: One combined email + one combined WhatsApp listing all selected sessions.
- **Sales (you)**: One sales email per session + one WhatsApp per session (so each shows up individually for triage).

Both messages will include:

> *"Your video lesson link will be sent to you shortly before the session."*

### Admin: `/trial-bookings` page changes

1. **New "Review Room" button** next to the "Trial Lesson Requests" title — links to `/review-room` (so admins can preview / share the booking link).
2. **Tab switcher** above the existing table:

```text
[ All ] [ Trial Lessons ] [ Review Room ]
```

The Review Room tab filters by `booking_source = 'review_room'` and shows day sub-tabs:

```text
[ All Days ] [ Sat 25 Apr ] [ Sun 26 Apr ] [ Sat 2 May ] [ Sun 3 May ]
```

Status badges + the existing approval dialog continue to work — approval links are out of scope for this round (you said "we'll plan that soon").

### Files

**New**
- `src/pages/ReviewRoom.tsx` — 2-step booking page
- `src/components/reviewRoom/SessionPicker.tsx` — multi-select grid

**Changed**
- `src/App.tsx` — add public `/review-room` route
- `src/services/trialBookingService.ts` — add `createReviewRoomBookings(sessions[], contact)`: loops the inserts, fires one combined parent confirmation, one sales notification per booking. Skips HubSpot for `booking_source = 'review_room'`.
- `src/pages/TrialBookings.tsx` — add "Review Room" button + source/day tabs.
- `supabase/functions/send-trial-booking-confirmation/index.ts` + email template — accept optional `sessions` array; add the "link sent shortly" line.
- `supabase/functions/_shared/whatsapp-templates.ts` — add Review Room confirmation template with multi-session summary + "link sent shortly" line.
- `supabase/functions/send-trial-sales-notification/index.ts` — add the "link sent shortly" line, label "Review Room" booking type.

### Database
No migration needed. `trial_bookings` already has `preferred_date`, `preferred_time`, `subject_id`, `booking_source`. Subjects (GCSE Maths / GCSE Science / GCSE English) already exist in the `subjects` table — IDs will be resolved at submission time.

### Out of scope (per your message)
- Lesson rooms / LessonSpace links — not created at submission. Notifications explicitly tell the user the link comes "shortly before".
- Approval workflow + tutor assignment — existing dialog handles approval; link generation will be designed in a follow-up.

