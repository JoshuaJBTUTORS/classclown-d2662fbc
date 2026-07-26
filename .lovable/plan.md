## Goal
When "Assessment Week" is clicked, pre-generate participant URLs for the tutor and every enrolled student pointing at the shared assessment room, so joining works immediately for everyone with no fallback/error screen.

## Change

In `src/components/calendar/LessonDetailsDialog.tsx` (`handleAssignAssessmentWeek`), after updating the lesson row and deleting old `lesson_participant_urls`:

1. Fetch enrolled students via `lesson_students` (join `students(id, first_name, last_name)`).
2. Fetch the newly assigned tutor's name (already have from `assessmentTutors` state).
3. Insert fresh rows into `lesson_participant_urls` for:
   - The tutor: `participant_id = tutor.id`, `participant_type = 'tutor'`, `launch_url = ASSESSMENT_ROOM_URL`.
   - Each student: `participant_id = student.id.toString()`, `participant_type = 'student'`, `launch_url = ASSESSMENT_ROOM_URL`.
4. Keep the existing lesson-row update and toast/refresh flow.

The shared room URL is a plain `/space/<uuid>` link that works for all participants — no per-user Launch API call needed.

## Why this fixes the screenshot

`useParticipantUrl` already short-circuits when `lesson_space_room_id === ASSESSMENT_ROOM_ID`, but any code path that reads `lesson_participant_urls` directly (or the edge function's dynamic fallback when a student isn't matched) fails after we delete rows. Inserting the shared URL for every participant means every path finds a valid pre-generated URL.

## Out of scope

- No changes to the edge function.
- No changes to how non-assessment lessons generate URLs.
