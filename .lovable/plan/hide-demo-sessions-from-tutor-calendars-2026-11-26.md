# Hide demo sessions from tutor calendars

## Why it happens
Last week, while looking into Sameera not seeing her trial, I changed the calendar so tutors see demo sessions too. Each trial booking creates two entries: a 15-minute demo, then the trial itself. Since that change, tutors see both.

## Change
- Tutors' calendars show only the trial lesson again. The demo entry is hidden for tutors.
- Admins still see demo sessions as they do now, including the "Demo Lessons" filter.
- Trial bookings and the demo window in availability checks stay as they are.

## Technical details
- `src/hooks/useCalendarData.ts`, tutor branch of the query (around line 361): add `.neq('lesson_type', 'demo')` back and update the comment.
- No database changes.
