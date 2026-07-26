## Problem

The Assessment Week action currently updates only `video_conference_link` and `lesson_space_room_url` on the lesson. Students and parents don't use those fields — `VideoConferenceLink.tsx` builds their join URL from `lesson_space_room_id`:

```
https://www.thelessonspace.com/space/${lessonSpaceRoomId}
```

Result: tutors/admins land in the shared assessment room, but students/parents still open the original room.

## Fix

In `src/components/calendar/LessonDetailsDialog.tsx`, extend the Assessment Week update so every field students/parents/tutors read points at the shared assessment room.

Shared assessment room details:
- URL: `https://www.thelessonspace.com/space/2670b244-b11f-4be3-8336-32bb2ce558e9`
- Room ID: `2670b244-b11f-4be3-8336-32bb2ce558e9`

Update the `lessons` row with:
- `tutor_id` → selected tutor
- `video_conference_link` → assessment URL
- `lesson_space_room_url` → assessment URL
- `lesson_space_room_id` → `2670b244-b11f-4be3-8336-32bb2ce558e9` (new)
- `lesson_space_space_id` → `2670b244-b11f-4be3-8336-32bb2ce558e9` (new, so the teacher-side room resolver also lands in the assessment room)

No schema changes, no backup column, no revert button (per user's choice). Original room ID for that lesson is not preserved.

## Verify

After change: an admin runs Assessment Week on a test lesson, then loads the same lesson as a student/parent and confirms the "Join" button opens the shared assessment room URL.
