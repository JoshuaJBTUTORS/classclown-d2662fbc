# Give Agent Cleo real knowledge of a student's record

Agent Cleo can already read every table, but nothing tells it where a student's lesson summaries, assessment results, attendance or homework actually live, or the conventions around them (blank answers excluded from scoring, `reviewed` status, student id vs user id). So it hunts around and sometimes gets the numbers wrong. This adds the domain knowledge plus one purpose-built tool.

## What Cleo will be able to answer

- "How is Amara doing?" — attendance, engagement trend, what went well, areas for improvement.
- "What did she score on the last assessment week, and which questions did she lose marks on?"
- "What topics keep coming up as weaknesses across her lessons?"
- "Has she been doing her homework?"
- "Which students are struggling most this month?"

## Changes

### 1. New STUDENTS section in the Agent Cleo system prompt

Naming the tables and their quirks:

- `students` — id is an **integer**, plus `user_id` (auth uuid) and `parent_id` → `parents`. Many student-linked tables key off `student_id`, others off `user_id`, so resolve both before querying.
- `lesson_student_summaries` — the per-lesson AI summary: `what_went_well`, `areas_for_improvement`, `topics_covered`, `engagement_level` / `engagement_score`, `confidence_score`, `homework_brief`, `attendance_status`. This is the richest source for "how are they doing".
- `student_lesson_insights` — the denormalised, dashboard-facing mirror of the above (subject, lesson title, week_start_date, `is_meaningful`). Use it for trends over time; use the summaries table for the narrative text.
- Absence rule: when `attendance_status` marks a miss, engagement/confidence are meaningless — report it as missed, never as low engagement.
- `assessment_assignments` (`assigned_to` = the student's **user uuid**, `status` of pending / submitted / reviewed, `submitted_at`, `reviewed_at`) → `ai_assessments` for title, subject, exam board and total marks.
- `assessment_sessions` — one attempt: `total_marks_achieved` / `total_marks_available`, `attempt_number`, `time_taken_minutes`, `status`.
- `student_responses` → `assessment_questions` — per-question `student_answer`, `marks_awarded`, `ai_feedback`. **Blank answers are skipped questions and are excluded from the percentage** — score attempted questions only, and report skipped count separately.
- `assessment_improvements` — stored `weak_topics` and `improvement_summary` for a session; prefer it over re-deriving weaknesses.
- Supporting tables: `lesson_attendance`, `homework` + `homework_completion_status`, `lesson_revision_notes` (flashcards), `school_progress` (uploaded reports/mock results), `topic_requests`.
- Results are sensitive: give them to admins/owners when asked, don't volunteer another family's data in an unrelated answer.

### 2. New `student_snapshot` tool

One call, given a student name or id, returning a single structured object:

- profile: name, year/grade, subjects, status, account type, linked parent contact
- attendance over the last 90 days (attended / missed counts and the missed dates)
- recent lessons (last 10) with topics, engagement, what went well, areas for improvement
- recurring weakness themes gathered across those summaries
- assessments: every assignment with status, and for reviewed ones the attempted-only score, percentage, skipped count and the lowest-scoring questions with AI feedback
- homework completion rate for the last 8 weeks
- upcoming lessons (next 14 days)

If the name matches more than one student it returns the candidates so Cleo asks which one instead of guessing.

### 3. Percentage consistency

The snapshot computes assessment percentages the same way the UI does — denominator counts only questions with a non-blank answer — so Cleo's numbers always match `/assessment-assignments`.

## Technical notes

- All work is in `supabase/functions/agent-cleo/index.ts`: the prompt text, one new entry in the `tools` array, and its handler.
- Reads go through the existing `agent_cleo_exec` RPC, which is SELECT-only — no new write surface, no schema migration.
- Times are UTC in the database; the snapshot converts with `AT TIME ZONE 'Europe/London'` before returning dates.
