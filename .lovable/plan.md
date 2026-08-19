# Why future lessons appear on Lesson Summaries (and how to stop it)

## What I found

The page lists Oct 6 and Oct 13 2026 cards even though today is 19 Aug 2026. Two separate causes, both confirmed:

1. **The page has no upper date bound.** `src/pages/LessonSummaries.tsx` fetches every lesson that has a `lesson_space_session_id` and the date filter only applies a lower bound (`start_time >= now - 30 days`). Anything in the future passes straight through.

2. **Future lessons are wrongly carrying a session id and recording URL.** 15 lessons scheduled after now already have `lesson_space_session_id` set, running out to 13 Oct 2026. They are all recurring instances that reuse the same LessonSpace room as an earlier occurrence, and the same session id has been stamped onto several future dates (e.g. session `051937cd…` sits on both 22 Sep and 6 Oct "1-1 KS2 English"). So a summary card for October is actually pointing at a recording from a lesson that already happened.

Result: a parent or tutor can click "Recording" or "Revision Notes" on a lesson that hasn't happened, and get another date's content.

## The fix

### 1. Only show lessons that have already finished (frontend)
In `src/pages/LessonSummaries.tsx`, filter the query and the client-side filter to `end_time <= now`. Future-dated lessons never appear regardless of the session id state. This alone removes the October cards immediately.

### 2. Clear the bad session ids (data)
One-off cleanup: null out `lesson_space_session_id` and `lesson_space_recording_url` on any lesson whose `start_time` is in the future. Nothing legitimate can exist there — a session cannot have run for a lesson that hasn't started.

### 3. Stop it happening again (backend guard)
Add a "lesson must have started" check wherever a session id gets bound to a lesson:
- `find-lesson-sessions` — skip lessons whose `start_time` is in the future when matching room sessions.
- `lessonspace-session-webhook` — when picking the closest lesson for a room, exclude occurrences that start more than a few minutes after the event.
- `get-lessonspace-recording` — don't persist a recording URL onto a lesson that hasn't run.

## Technical notes

Files: `src/pages/LessonSummaries.tsx`, `supabase/functions/find-lesson-sessions/index.ts`, `supabase/functions/lessonspace-session-webhook/index.ts`, `supabase/functions/get-lessonspace-recording/index.ts`. Cleanup is a single UPDATE migration, no schema change.
