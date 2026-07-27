Fix Assessment Week assignment so students without a linked account fall back to their parent's account.

## Root cause
`handleAssignAssessmentWeek` in `src/components/calendar/LessonDetailsDialog.tsx` only assigns the assessment to `students.user_id`. Most students are minors and have `user_id = null`, so all 4 got skipped even though their parents have accounts.

## Changes — `src/components/calendar/LessonDetailsDialog.tsx`
- Update the enrolled-students query to also pull the parent's user_id:
  `student:students(id, user_id, first_name, last_name, parent:parents(user_id))`
- For each enrolled student, resolve `targetUserId = student.user_id ?? student.parent?.user_id ?? null`.
- Split into:
  - `resolved` = students with any `targetUserId` (student or parent).
  - `skipped` = students where neither exists.
- Dedupe by `targetUserId` (a parent with multiple kids in the group only gets one row per assessment).
- Keep the existing "already assigned" check against `assessment_assignments`.
- Update toast copy to `"Assessment week assigned — sent to X of Y students (via parent where needed)"` and only show the skipped toast when `skipped > 0`.

No DB/schema changes.