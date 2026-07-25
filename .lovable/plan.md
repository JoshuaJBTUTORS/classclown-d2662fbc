# Handle non-attendance in lesson summaries

Right now, when a student doesn't join a lesson, the AI still runs engagement analysis on the transcript and reports "Low engagement" — misleading parents and admins, and wasting compute. We'll treat non-attendance as a first-class state.

## Behaviour changes

1. **Skip engagement computation for absent students.** In `generate-lesson-summaries` (and the per-student segment paths), before analysing a student, look up `lesson_attendance.attendance_status` for that `(lesson_id, student_id)`.
   - If status is `absent`, `excused`, or (attendance row exists but student is not `attended`/`late`) → skip the OpenAI calls entirely.
   - Write a lightweight row into `lesson_student_summaries` with:
     - `engagement_level = null`, `engagement_score = null`, `confidence_score = null`, `participation_time_percentage = null`
     - `topics_covered = []`
     - `ai_summary = "Student did not attend this lesson."` (or "Marked as excused absence.")
     - a new flag we can key off (see below).

2. **New "did not attend" flag** on `lesson_student_summaries`:
   - Add column `attendance_status text` (nullable) synced from `lesson_attendance` at generation time.
   - `student_lesson_insights` already has `attendance_status` and `is_meaningful`; the existing trigger `sync_insight_attendance` will keep them aligned.

3. **UI: "Did Not Attend" tag** in the summaries list (`src/components/calendar/StudentLessonSummary.tsx` and any student row in `src/pages/LessonSummaries.tsx`):
   - When `attendance_status` is `absent`/`excused` OR summary is empty and attendance says missed, render a neutral badge (e.g. amber "Did not attend" / grey "Excused absence") *instead of* the engagement/confidence badges and the numeric scorecards.
   - Hide the engagement/confidence/participation blocks for those rows so nothing reads as "Low engagement".

4. **Backfill existing rows** (one-off SQL): for every `lesson_student_summaries` row where the matching `lesson_attendance` is `absent`/`excused`, null out `engagement_score`, `confidence_score`, `participation_time_percentage`, `engagement_level`, and set `ai_summary = 'Student did not attend this lesson.'` plus `attendance_status`.

## Technical details

- **Migration**: `ALTER TABLE public.lesson_student_summaries ADD COLUMN attendance_status text;` (plus grants already exist).
- **Edge function `generate-lesson-summaries`**:
  - At the top of the per-student loop (both the segmented aggregator around line ~452 and the single-shot path around line ~951), fetch attendance for the lesson once, map by `student_id`, and short-circuit as described.
  - When writing summary rows (upserts around lines ~511 and ~999), always include `attendance_status`.
- **Frontend**:
  - `StudentLessonSummary.tsx`: add a `didNotAttend` derived flag (`attendance_status === 'absent' || 'excused'`). Replace engagement badges/cards with a single status badge and short message.
  - `LessonSummaries.tsx`: same treatment on the list rows; ensure filtering/sorting by engagement ignores did-not-attend rows.
- No changes to attendance capture flow — we're only consuming existing `lesson_attendance` data.

## Out of scope

- Changing how attendance is marked.
- Any re-run of past OpenAI analyses for attended students.
