# Ask students what they want covered, and show it to the teacher

Two related changes to the lesson join flow, plus the earlier impact-moments work (kept at the bottom).

## 1. Student join screen

When a student or parent clicks "Join Lesson", the camera and microphone agreement appears as it does today. The lesson details box at the top (title, time, teacher, group lesson) is replaced with a short request question:

- "Is there anything specific you'd like covered in this session?" with Yes / No buttons.
- Choosing Yes reveals a text box for them to type what they want covered.
- Answering is mandatory — the "I Accept & Join Lesson" button stays disabled until Yes or No is picked, and if Yes is picked the box must not be empty.
- On accept, a Yes answer is saved as a topic request against that lesson before the room opens. A No answer saves nothing and joins straight away. If saving fails, they still join — it never blocks the lesson.

Everything else in the agreement (camera rules, warning panel, welcome line, buttons, spinner) stays exactly as it is.

## 2. Teacher view in the lesson room

In the top bar of the lesson room, next to the lesson title and time, teachers get a "Topic requests" chip showing the number of requests for that lesson. Clicking it opens a small panel listing each request: student name, what they asked for, and when it was submitted. The chip is hidden when there are no requests and is never shown to students.

## Technical details

- `src/components/lessons/LessonConsentDialog.tsx`: replace the lesson-details card with the Yes/No question plus conditional textarea; add `topicRequest` state and gating on the accept button. Callers pass the resolved student id so the request can be saved. Text limited to 500 characters and trimmed.
- Both call sites (`VideoConferenceLink.tsx`, `LessonStartPopup.tsx`) already resolve the student for the session; they pass `studentId` (and `parentId` for parents) alongside `studentName`.
- Saving writes to the existing `topic_requests` table (`lesson_id`, `student_id`/`parent_id`, `requested_topic`, default `pending`). Existing insert policies already allow students and parents.
- Database migration: tutors currently have no read access to `topic_requests`. Add a select policy letting a tutor see requests for lessons they teach (match `lessons.tutor_id` to the current tutor), plus the matching grant.
- New component `src/components/video/TopicRequestsChip.tsx` used by `VideoRoomHeader.tsx`, rendered only when `userRole === 'tutor'`; loads requests for `lessonId` and shows them in a popover using the existing chip styling.

## Still outstanding from the previous plan

- Delete the 37 stored high-impact moments.
- Add a high-impact moments alert banner on `/agent-cleo`, styled like the tutor breach banner, with per-user dismissals.
