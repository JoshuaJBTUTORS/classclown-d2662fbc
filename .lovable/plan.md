## Goal
When Agent Cleo creates a lesson (or recurring series), each created lesson should also get a LessonSpace room, exactly like lessons created through the calendar.

## How rooms are created today
`supabase/functions/lesson-space-integration` handles `{ action: 'create-room', lessonId }` and writes `lesson_space_room_id` / `lesson_space_room_url` / `lesson_space_space_id` onto the lesson. The backfill function (`backfill-lesson-space-rooms`) calls it per lesson with a 250ms gap and logs failures into `failed_room_creations`. Agent Cleo's creation endpoint (`agent-cleo-create-lesson`) inserts lessons and links students, but never calls it — that's the gap.

## Change
In `supabase/functions/agent-cleo-create-lesson/index.ts`, after students are linked and the series is fully created:

1. Loop over every created lesson id (parent + recurring occurrences).
2. Invoke `lesson-space-integration` with `{ action: 'create-room', lessonId }` using the service client, 250ms delay between calls to respect the LessonSpace rate limit.
3. Treat room creation as non-fatal: if one fails, keep the lesson, record the failure in `failed_room_creations` (same shape the backfill uses: lesson_id, error_message, error_code, attempt_count, last_attempt_at, resolved=false).
4. Return `rooms_created` and `rooms_failed` counts in the JSON response so the outcome is visible.

## Notes
- No rollback change: a lesson without a room is still a valid lesson and the existing backfill job can retry it.
- Long series (up to 52 occurrences) add ~13s of sequential calls; if that risks a timeout, rooms will be created for the parent first and remaining occurrences in the same loop, with failures left to the backfill job.
- No database migration and no frontend change needed; the Agent Cleo confirmation card flow is untouched.
