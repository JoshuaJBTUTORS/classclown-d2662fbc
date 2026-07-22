## Goal

Expose the per-lesson `homework_brief` (subject, year group, topics, difficulty tag 1/2) on the existing admin-facing student report at `/students-list/:studentId`, so you can visually confirm the new field is being generated correctly.

## Scope

Admin-only. No permission or routing changes. Reuses the current page.

## Changes

1. **`src/hooks/useStudentWeeklyTopics.ts`**
   - After fetching `student_lesson_insights` for the week, do a second lookup on `lesson_student_summaries` filtered by `student_id` + the same lesson IDs, selecting `lesson_id, homework_brief`.
   - Attach the resulting `homework_brief` onto each `WeeklyLessonEntry` (new optional field).

2. **`src/pages/StudentDetail.tsx`**
   - Under each lesson row, if `homework_brief` exists, render a small "Homework brief" panel showing:
     - Subject, Year group
     - Topics (chips)
     - Difficulty tag with clear label: `1 — Not understanding` or `2 — Partial understanding`
   - If missing, show a muted "Homework brief not yet generated" line so it's obvious when the pipeline hasn't run.

## Out of scope

- No student/parent-facing exposure.
- No schema changes.
- No changes to generation logic.
