## What I found

- The lesson row did update to the shared assessment room:
  - `lesson_space_room_id`: `2670b244-b11f-4be3-8336-32bb2ce558e9`
  - `lesson_space_space_id`: `2670b244-b11f-4be3-8336-32bb2ce558e9`
  - `video_conference_link`: shared assessment room URL
- The join page does **not** use those fields directly. `/video-room/:lessonId` loads a pre-generated `lesson_participant_urls.launch_url`.
- Those participant URLs still point to the old LessonSpace room, so pressing Join Lesson/Host Room can still open the original room even though the lesson fields were updated.

## Plan

1. Update the Assessment Week action in the lesson details dialog so it also clears existing rows in `lesson_participant_urls` for that lesson after switching the lesson to the assessment room.
2. Update `useParticipantUrl` so if no pre-generated URL exists, it calls the existing `lesson-space-integration` `join-space` action to generate a fresh Launch URL for the lesson’s current `lesson_space_space_id`.
3. Adjust the teacher/admin join flow as needed so hosts are not blocked by a missing old participant URL after Assessment Week changes.
4. Verify against the affected lesson that:
   - Old participant URLs no longer force the old room.
   - Joining after Assessment Week uses the shared assessment LessonSpace room.

## Technical notes

- This avoids changing the database schema.
- The issue is stale cached/persisted participant launch URLs, not the lesson room fields themselves.
- Existing future LessonSpace transcript handling should continue to use the updated `lesson_space_room_id`.