## Goal

On `/assessment-assignments`, each assessment card gets a **Refresh** button. Clicking it sends the assessment's existing questions to OpenAI (called directly, not via Lovable AI Gateway) which returns near-identical variants — swap names, numeric values, small wording tweaks — while keeping question_type, marks, difficulty, topic, and structure identical. Correct answers and mark schemes are recomputed to match the new values. Refresh overwrites existing questions in place and deletes all previous student answers/sessions for that assessment.

## UX

- New **Refresh** button on each card in `renderAssessmentCard` (`src/pages/admin/AssessmentAssignments.tsx`), next to Preview/Edit.
- Click → confirm dialog: "This will regenerate all questions with new variants and permanently delete all previous student answers for this assessment. Continue?"
- Confirm → button spinner, invoke edge function, toast on success/error, invalidate `all-assessments` and `assessment-questions` queries.

## Backend: new edge function `refresh-assessment`

Calls OpenAI directly using the existing `OPENAI_API_KEY` secret. Model: **`gpt-4o`** (strong reasoning, reliable strict JSON, existing project pattern). Uses `response_format: { type: "json_schema", strict: true }` so the answer/mark-scheme shape is guaranteed.

Input: `{ assessment_id: string }` (auth required; admin/owner/tutor/creator only — mirror `useAssessmentPermissions.canEdit`).

Steps:
1. Verify JWT, load caller roles, enforce edit permission.
2. Load assessment + all `assessment_questions` ordered by `question_number`.
3. Process in batches of 5 questions. For each batch, POST to `https://api.openai.com/v1/chat/completions` with a system prompt: "You rewrite exam questions as equivalent variants. Keep question_type, marks_available, difficulty, topic, and structural style identical. Change only surface details (names, numeric values, dates, minor wording). Recompute correct_answer and mark_scheme so they are fully consistent with the new values. For multiple choice, keep option count identical and update options + correct option." Provide the original questions as JSON; require strict JSON output matching a schema of `{ questions: [{ id, question_text, correct_answer, mark_scheme, options? }] }`.
4. After all batches succeed, run updates + cleanup with service-role client:
   - `UPDATE assessment_questions` per returned id with new `question_text`, `correct_answer`, `mark_scheme`, and `options` where present.
   - `DELETE FROM student_responses WHERE session_id IN (SELECT id FROM assessment_sessions WHERE assessment_id = $1)`
   - `DELETE FROM assessment_sessions WHERE assessment_id = $1`
   - `DELETE FROM marking_jobs WHERE assessment_id = $1`
   - `UPDATE assessment_assignments SET status='assigned', submitted_at=NULL, reviewed_at=NULL, reviewed_by=NULL WHERE assessment_id = $1`
5. Return `{ success: true, updated: N }`.

If any batch fails, abort before deletes — original questions and student data stay intact. Surface OpenAI 429/insufficient_quota errors clearly for UI toast.

## Frontend wiring

- `refreshMutation` in `AssessmentAssignments.tsx` invoking `supabase.functions.invoke('refresh-assessment', { body: { assessment_id } })`.
- AlertDialog for confirmation.
- Button disabled + spinner while pending; toast success/error.

## Files touched

- `supabase/functions/refresh-assessment/index.ts` (new)
- `src/pages/admin/AssessmentAssignments.tsx` (button, confirm dialog, mutation)

## Out of scope

- No schema changes.
- No changes to assessment creation, preview dialog, or take flow.
- Options field only updated when the existing row has options.
