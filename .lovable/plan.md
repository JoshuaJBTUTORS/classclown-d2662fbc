# Assessment Results: Visibility & Notifications

## Current state
- AI marking writes results into `student_responses` (`marks_awarded`, `ai_feedback`, `marking_breakdown`) and updates `assessment_sessions` (`total_marks_achieved`, `total_marks_available`).
- Admins can already view and mark submissions from `/assessment-assignments` using the **View & Mark** button → `MarkSubmissionDialog`.
- Students can currently only see a "Submitted" badge on `/assessment-center` and the read-only exam paper in `/assessment-center/:id/take`. They do **not** see their score, per-question marks, or feedback.
- Parents have no dedicated assessment-results view.
- There is no automatic notification when marking completes or when an assignment becomes "reviewed".
- `assessment_improvements` exists but is not automatically populated after AI marking.

## Proposed work

### 1. Student results page
- Create `/assessment-center/:assignmentId/results`.
- Show overall score, percentage, and a per-question breakdown: student answer, marks awarded, max marks, and AI feedback.
- Display weak topics / improvement summary if `assessment_improvements` exists.
- Link to this page from the "Completed" tab in `AssessmentCenter` (replace the current "View Submission" button that re-opens the exam paper).

### 2. Parent results view
- Add an "Assessments" tab or section to the parent dashboard (`/parent` or existing progress area).
- Show the same high-level score and weak topics for their linked children.
- Hide per-question correct answers to avoid spoiling future attempts.

### 3. Auto-generate improvement recommendations
- After `mark-assessment-session` finishes a session, trigger `assessmentImprovementService.generateImprovements(sessionId)` (or call a lightweight edge function) to populate `assessment_improvements`.
- Display the resulting weak topics and recommended lessons on the student/parent results page.

### 4. Notifications when marking is complete
- When an assignment status moves to `reviewed`, create a notification row in `notifications` for the student and each linked parent.
- Send a WhatsApp and email message using the existing notification patterns, including the assessment title, score, and a link to the results page.

### 5. Admin workflow polish
- Keep the existing `MarkSubmissionDialog` as the admin review surface.
- After AI marking finishes, surface a one-click **Mark Reviewed & Notify** action so admins control when results are released.

## Out of scope (unless requested)
- Leaderboards or class comparisons.
- PDF report generation.
- Re-marking history/audit log.

## Files likely to change
- `src/pages/AssessmentCenter.tsx`
- `src/pages/AssessmentTake.tsx`
- New: `src/pages/AssessmentResults.tsx`
- `src/services/assessmentAssignmentService.ts`
- `src/services/assessmentImprovementService.ts`
- `src/components/assessments/MarkSubmissionDialog.tsx`
- `src/App.tsx`
- `supabase/functions/mark-assessment-session/index.ts` or new edge function for improvement generation
- Existing notification/email/WhatsApp shared code under `supabase/functions/_shared/`
