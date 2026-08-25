# Lesson completion: Submit Resources instead of Set Homework

Change the lesson completion flow in the calendar lesson dialog to two steps:

1. Mark Attendance (unchanged)
2. Submit Resources — the tutor uploads the file(s) used in the session

Homework is removed from the completion flow.

## What changes for the tutor

- The "Lesson Completion Progress" card shows **Mark Attendance** then **Submit Resources**, each with a Complete/Pending state.
- The "Set Homework" / "Edit Homework" button in the lesson dialog is replaced by **Submit Resources**, which opens a small dialog:
  - File upload (one or more files, e.g. PDF, slides, images, docs)
  - Optional note describing what was used
  - Save
- After saving, the step flips to Complete and shows the number of files submitted. The tutor can reopen it to add more files or remove one.
- Resources are stored in the backend only — nothing is shown to students or parents anywhere.

## Storage and data

- New private storage bucket `lesson-resources`, files stored under `<lesson_id>/<uuid>-<filename>`.
- New table `lesson_resources`: lesson id, uploader id, file name, file path, file type, file size, optional note, timestamps.
- Access rules: tutors, admins and owners can add, view and remove resource records; students and parents have no access. Storage policies mirror this on the bucket.

## Technical notes

- Migration creates the table with GRANTs for `authenticated` and `service_role`, RLS enabled, policies keyed on `has_role(auth.uid(), 'tutor'|'admin'|'owner')`; plus `storage.objects` policies scoped to the `lesson-resources` bucket.
- New hook `useLessonResources(lessonId)` for fetch/upload/delete.
- New component `src/components/lessons/SubmitResourcesDialog.tsx`.
- `src/components/calendar/LessonDetailsDialog.tsx`: swap the homework checklist row and the homework button for the resources equivalents; remove `checkHomeworkStatus`, `AssignHomeworkDialog` and `HomeworkCompletionCheckDialog` usage from this dialog only.
- Homework code elsewhere (the `/homework` page, HeyCleo sync, weekly release, the last-week homework chips on student rows) is left untouched.
- `useLessonCompletion` keeps its current behaviour unless completion badges elsewhere need updating; no change planned there in this pass.
