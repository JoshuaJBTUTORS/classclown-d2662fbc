# Show approved time off on the teacher calendar view

Right now the teacher (tutor) calendar view only looks at a tutor's weekly availability rules and their booked lessons. Approved time off is never checked, so a tutor like Lyba Samar (approved time off covering 23 September 2026) still shows a green "Available" box.

## What changes

- Approved time off is loaded for the tutors and date range currently shown.
- Any day (week view) or hour cell (day view) that falls inside an approved time-off period is shown as a pale red box labelled "Time off" instead of a green "Available" box.
- Time off wins over availability: even if the tutor has availability rules for that day, the cell shows time off.
- Cells that already contain lessons keep showing the lessons as they do today.

## Technical notes

- `src/hooks/useTutorAvailability.ts`: additionally query `time_off_requests` for the visible `tutor_id`s where `status = 'approved'` and the period overlaps the visible range (`start_date <= range.end` and `end_date >= range.start`). Change the per-slot value from a boolean to a small status (`'available' | 'unavailable' | 'time_off'`) keyed the same way as now, marking a slot `time_off` when the slot interval overlaps any approved request. Week-view cells use the whole day; day-view cells use that hour.
- `src/components/calendar/TutorRow.tsx`: accept the new status map and render a pale red cell (existing red/destructive-tinted utility classes consistent with the current green cell styling) with the label "Time off" when status is `time_off`.
- `src/components/calendar/TeacherCalendarView.tsx`: no logic change beyond passing the updated data through.
- Time-off timestamps are stored in UTC; compare using the same date basis the calendar already uses so a UK-day request (23:00 previous day to 22:59) marks the correct single day.
