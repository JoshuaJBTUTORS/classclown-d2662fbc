# View submitted assessments and mark them with AI

## Where things stand

Submitted work lives at **/assessment-assignments** (People/Assessments → Assessment Assignments, admin/owner only). The "Pending Review" tab lists the 55 submitted assignments, but each card only offers "Mark Reviewed" — there is no way to open a student's answers, and no way to trigger AI marking.

Nothing from the last round has actually been marked: all 1,517 stored answers still sit at 0 marks with no feedback and no `marked_at`. The `ai-mark-assessment` edge function only handles **one question at a time**, and the service call meant to mark a whole session (`aiAssessmentService.markAnswers`) sends no question id, so it fails.

## What to build

**1. A "View & Mark" dialog per submission**

Each submitted assignment card gets a "View & Mark" button. The dialog shows, for that student's session:

- Header: student name, assessment title, submitted date, and score so far (marks awarded / total marks).
- One row per question: question text, the student's answer, marks awarded out of available, and AI feedback once marked. Unmarked questions show as "Not marked yet".
- A **Mark with AI** button that runs the whole session and streams progress ("Marking 6 of 22..."), then refreshes the rows in place.
- Marks stay editable by hand: an admin can override the AI's mark and feedback on any question.

**2. A batch "Mark all submissions" action**

On the Assessments tab, each assessment gets a "Mark all submissions" button that queues every unmarked submitted session for that assessment, showing a progress bar and an ETA while it runs.

**3. Assignment cards show the student**

Cards currently show only the assessment title; they'll show the student's name too so the list is usable.

## How marking behaves

- Blank answers are skipped and recorded as 0 with a "no answer given" note — no AI call, no wasted tokens.
- Already-marked questions are skipped unless "re-mark" is chosen.
- Failures on individual questions don't stop the run; they're retried with back-off and reported at the end.
- Once every question in a session is marked, the assignment flips to "reviewed" automatically.

## Technical notes

- New edge function `mark-assessment-session`: takes `sessionId` (optionally `assessmentId` for batch), loads questions + `student_responses`, loops unmarked non-blank answers, calls OpenAI directly with `OPENAI_API_KEY` (same `gpt-4.1` prompt as the existing single-question function, extracted into `supabase/functions/_shared/`), and writes `marks_awarded`, `ai_feedback`, `marking_breakdown`, `confidence_score`, `marked_at`, `marked_by`.
- Long runs use the existing `marking_jobs` table for progress: the function processes a chunk, updates `marked_count` / `last_processed_response_id`, and self-invokes for the next chunk so it never hits the wall-clock limit. The UI polls the job row every 3s.
- Fix `aiAssessmentService.markAnswers` to call the new function; add `getSessionResponses(sessionId)` and `overrideMark(responseId, marks, feedback)`.
- New component `src/components/assessments/MarkSubmissionDialog.tsx`; `src/pages/admin/AssessmentAssignments.tsx` gains the button, the batch action and the student name on cards.
- No schema change needed — `student_responses` and `marking_jobs` already have every column required.
