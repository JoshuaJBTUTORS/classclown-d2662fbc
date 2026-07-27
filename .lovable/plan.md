## Goal

Extend the Assessment Week flow in the calendar lesson dialog so that, after picking the tutor, the admin also picks an assessment. That assessment is then assigned to every enrolled student in the group so it appears in their Assessment Center.

## Changes (all in `src/components/calendar/LessonDetailsDialog.tsx`)

1. In `openAssessmentDialog`, in addition to loading tutors, also load published assessments from `ai_assessments` (`id, title, subject, exam_board, year` where `status = 'published'`, ordered by title).
2. Add new state: `assessments`, `selectedAssessmentId`, and optional `assessmentDueDate` (default: lesson end date).
3. Update the "Assign Assessment Week" dialog UI:
   - Keep the tutor select.
   - Add a searchable Select for the assessment (title + subject/year subtitle).
   - Add an optional due date input (defaults to the lesson date).
   - Disable the confirm button until both tutor and assessment are chosen.
4. In `handleAssignAssessmentWeek`, after the existing tutor reassignment + participant URL insert:
   - Fetch enrolled students including `user_id` (`students(id, user_id, first_name, last_name)`).
   - For each student with a `user_id`, build an `assessment_assignments` row: `assessment_id`, `assigned_to = student.user_id`, `assigned_by = current auth user id`, `due_date`, `status = 'assigned'`, `notes = "Assigned via Assessment Week for <lesson title>"`.
   - Upsert with `onConflict: 'assessment_id,assigned_to'` (fallback: pre-check existing rows and only insert missing ones) so re-running doesn't error on duplicates.
   - Skip students without a `user_id` and surface a soft toast listing how many were skipped.
5. Success toast reports counts: `"Assessment week assigned — assessment sent to X of Y students"`.
6. Preserve existing behaviour: lesson tutor swap, shared assessment room URL, participant URLs.

## Out of scope

- No schema changes.
- No changes to Assessment Center rendering — it already lists assignments via `assessmentAssignmentService.getStudentAssignments()`.
- No changes to non-Assessment-Week lessons.
