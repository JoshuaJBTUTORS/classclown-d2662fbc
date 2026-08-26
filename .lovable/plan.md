# Make the lesson popup use the same join route as the calendar

## Problem

The "It's time for your lesson" popup sends users to `/join-lesson/:lessonId` (`StudentJoinPage.tsx`), a legacy page that:

- Looks up the parent's child using `student.parent_id`, but the lesson query only selects `id, first_name, last_name` — `parent_id` is never fetched, so the match always fails and parents get "You are not enrolled in this lesson".
- Still points at the retired flexible-classroom flow (`/flexible-classroom/:lessonId`) rather than LessonSpace.

The calendar's "Launch Room" path (`VideoConferenceLink.tsx`) instead shows the recording-consent dialog and then navigates to `/video-room/:lessonId`, which resolves the parent's child correctly via `lesson_students -> students(parent_id)`.

## What to change

1. `src/components/lessons/LessonStartPopup.tsx` — "Join Now" navigates to `/video-room/${lesson.id}` instead of `/join-lesson/${lesson.id}`, matching the calendar route.
2. Keep the consent step consistent: students/parents joining from the popup see the same recording-consent confirmation the calendar shows before entering the room, reusing the existing consent dialog component.
3. Retire the stale route: remove the `/join-lesson/:lessonId` route and `StudentJoinPage.tsx`, since nothing else links to it and it references the removed flexible-classroom flow.

## Files

- `src/components/lessons/LessonStartPopup.tsx` (route + consent)
- `src/App.tsx` (drop the `/join-lesson` route)
- `src/components/lessons/StudentJoinPage.tsx` (delete)
