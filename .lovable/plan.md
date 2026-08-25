# Clickable homework chip → homework detail panel

Make the homework status chip in the calendar's lesson dialog clickable. Clicking it opens a side panel showing that student's recent HeyCleo homework so a tutor can review it before/while joining the lesson.

## Behaviour

- The chip (HW done / started / not started) becomes a button with hover + focus styles. Tooltip stays for the quick summary.
- Clicking opens a right-hand side panel titled with the student's name.
- Panel contents:
  - Header: student name, linked HeyCleo account status.
  - Highlighted card for last week's homework: title, subject, due date, status badge, score (awarded/available and percentage), started/submitted timestamps.
  - Below it, a list of the student's other recent homework (most recent ~10 by due date) with the same fields in compact rows.
  - Empty state when no HeyCleo record is linked or no homework exists.
- Chip with "No HW data" is still clickable and opens the panel showing the empty state (explains no linked HeyCleo account / no assignments).

## Technical notes

- `src/hooks/useHeyCleoHomeworkStatus.ts`: also return the resolved CRM-student-id → HeyCleo-student-id map so the panel can query by HeyCleo id without redoing the email matching.
- New hook `src/hooks/useHeyCleoStudentHomework.ts`: given a HeyCleo student id, fetch recent rows from `heycleo_homework_completion` ordered by due date desc (limit 10). Disabled when no id.
- New component `src/components/lessons/HomeworkDetailPanel.tsx`: shadcn `Sheet`, driven by `open` / `onOpenChange` / `studentName` / `heycleoStudentId` / `status` props.
- `src/components/lessons/HomeworkStatusChip.tsx`: wrap the badge in a button, accept an `onClick` prop.
- `src/components/lessons/StudentAttendanceRow.tsx`: accept `heycleoStudentId`, hold local open state, render the panel.
- `src/components/calendar/LessonDetailsDialog.tsx`: pass the mapped HeyCleo id through to each row.
- No database or edge function changes; reads use the existing tutor RLS policies on `heycleo_homework_completion`.
