# Show approved time off in a tutor's Calendar View

## Current state (verified)

- `/calendar` has no route-level role restriction, but the **Teacher View** tab in `src/pages/Calendar.tsx` is already gated by `canUseTeacherView = userRole === 'admin' || userRole === 'owner'` on both the tab trigger and the tab content. Tutors, parents and students cannot see it. No change needed there.
- Calendar View events come from `src/hooks/useCalendarData.ts`, which builds events from `lessons` only. Approved time off is never rendered, so a tutor's calendar looks empty/available during their approved leave.
- `time_off_requests` holds `tutor_id`, `start_date`, `end_date`, `reason`, `status`.

## Change

In `useCalendarData`, when the signed-in user is a tutor:

1. Resolve their tutor record (same email-based lookup pattern already used for other roles).
2. Fetch `time_off_requests` with `status = 'approved'` overlapping the current calendar date range.
3. Emit one calendar event per approved request alongside lesson events:
   - Title: "Time off" (plus reason when present)
   - Start/end from `start_date`/`end_date`, converted to UK time like lessons
   - A distinct pale-red `time-off-event` class added to `src/index.css`
   - `extendedProps.eventType: 'time_off'` so it is clearly not a lesson

4. In `src/components/calendar/LessonDetailsDialog.tsx` (or wherever event clicks are handled), ignore clicks on `eventType === 'time_off'` events so no lesson dialog opens for them.

## Out of scope

- Teacher View stays admin/owner only — unchanged.
- Parent and student calendar behaviour stays exactly as it is today.
- No database changes required.
