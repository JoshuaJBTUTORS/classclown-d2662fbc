# Handling started-but-unfinished assessments

## What the data actually shows

Three different kinds of "started but never finished" exist right now:

1. **4 assignments stuck at "in progress" with no session at all.** GCSE English Language, GCSE Maths Paper 1, KS3 Maths, KS3 Science (Summer Term Exams). The student opened the assessment, which flipped the assignment to in_progress, but no attempt record was ever created — nothing to mark.
2. **10 sessions still open (`in_progress`).** Mostly older ones (Aug–Nov 2025). Seven have zero answers; three have partial work (2, 3 and 6 answers). None of these appear in the Submitted tab, so they are invisible in the current marking UI.
3. **40 sessions marked `completed` but only partly answered** (answered fewer questions than the paper has), plus 7 completed sessions with zero answers. These *are* reachable today, but the dialog gives no signal that the paper was left incomplete — a half-finished paper looks the same as a full one.

## What to build

**1. An "Incomplete" tab on /assessment-assignments**

Alongside Submitted, a tab listing every attempt that was started but not properly finished: open sessions with any answers, and completed sessions where answered < total questions. Each row shows student name, assessment title, when they last worked on it, and progress ("6 of 19 answered").

**2. Completion badge everywhere**

Every submission card and the mark dialog header show "18/22 answered" with an amber badge when incomplete. Unanswered questions are listed in the dialog as "No answer submitted" rather than being omitted.

**3. Mark incomplete attempts too**

The existing Mark with AI action works on these unchanged: answered questions get marked normally, blanks score 0 with a "no answer given" note. So a partially-finished paper still produces a real score out of the full total. From the Incomplete tab an admin can mark an attempt as-is, or use "Close and mark" which stamps the session complete first.

**4. Clean up the empty stragglers**

For the 4 in_progress assignments with no session and the sessions with zero answers, no marking is useful. The Incomplete tab groups these separately as "Not attempted" with a "Reset to assigned" action so the student can be re-issued the paper, and they are excluded from batch marking.

## Technical notes

- `assessmentAssignmentService` gains `getIncompleteAttempts()`: joins `assessment_assignments` → `assessment_sessions` → `student_responses`, computing answered counts against `assessment_questions` per assessment; returns `{ answered, totalQuestions, sessionStatus, lastActivityAt }`.
- Answer emptiness uses `student_responses.student_answer` (trimmed non-empty) — the column is `student_answer`, not `answer_text`.
- `MarkSubmissionDialog` renders one row per *question* (left-joined to responses) instead of per stored response, so gaps are visible.
- "Close and mark" sets `assessment_sessions.status = 'completed'` + `completed_at`, then calls the existing `markSessionToCompletion`; no edge function change needed.
- "Reset to assigned" sets `assessment_assignments.status = 'assigned'` and clears `submitted_at`.
- No schema change required.
