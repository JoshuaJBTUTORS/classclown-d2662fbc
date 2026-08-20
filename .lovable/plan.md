# Catching attempts where the student forgot to hit "complete"

## What the data shows

I checked every session against its assignment. The good news: **every 2026 Summer Term attempt that has answers is already submitted** — nobody from the recent assessment week is stranded. The stranded ones are:

- **3 open sessions with real answers** that were never completed: "Assessment - The Alphabet" (2 answers, Nov 5), "Assessment - The Alphabet" (3 answers, Aug 10), "Assessment Electricity" (6 answers, Aug 4). All 2025.
- **7 open sessions with zero answers** — opened and abandoned, nothing to recover.
- **~15 sessions that *are* completed and have answers but have no assignment row at all** (student self-started, 2025 papers). These never show in the Submitted tab, so their work is invisible today even though it's finished.
- **4 assignments sitting at "in progress" with no session at all** (GCSE English Language, GCSE Maths P1, KS3 Maths, KS3 Science Summer Term) — the take page was opened but no attempt was ever created. Nothing to mark; they need re-issuing.

## What to build

**1. A "Not submitted" tab on /assessment-assignments**

Lists every attempt with at least one answer that hasn't reached submitted/reviewed — whether the session is still open or completed-without-an-assignment. Each row: student name, assessment title, last time they answered anything, and progress ("6 of 19 answered").

**2. "Submit on their behalf" action**

One click per row: stamps the session `completed` (if it isn't), flips/creates the assignment to `submitted`, and immediately runs the existing AI marking. Blank questions score 0 as they already do, so a half-finished paper produces a real score out of the full total.

**3. Stop it happening again — auto-close stale attempts**

A daily job closes any session that has answers but no activity for 48 hours: marks it completed and submitted, so it lands in the normal Submitted queue instead of silently rotting. Sessions with zero answers are left alone.

**4. Nudge before it goes stale**

The 4 in-progress-with-nothing assignments get a "Reset to assigned" action so the student can be re-issued the paper cleanly.

## Technical notes

- New service method `getUnsubmittedAttempts()` in `assessmentAssignmentService`: sessions left-joined to `assessment_assignments` on (assessment_id, user_id), filtered to those with a non-empty `student_responses.student_answer` count > 0 and assignment status not in (submitted, reviewed).
- Answer emptiness keys off `student_responses.student_answer` (trimmed) — the column is `student_answer`, not `answer_text`.
- "Submit on their behalf" updates `assessment_sessions.status/completed_at`, upserts the assignment row to `submitted` with `submitted_at`, then calls the existing `markSessionToCompletion` from `assessmentMarkingService` — no edge function change.
- Auto-close job: new edge function `close-stale-assessment-sessions` on a daily pg_cron schedule, applying the same 48-hour rule; it reuses the same submit-and-mark path.
- No schema change required.
