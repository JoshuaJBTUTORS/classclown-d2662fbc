

## Always Show Homework Completion Check Dialog

### Problem
The dialog currently queries for previous homework and auto-skips if none is found. This means tutors never see the completion check step.

### Solution
Remove the homework lookup entirely. The dialog should always show immediately with the student list and Yes/No/Excused options. Since we won't have a `homework_id` to link to, we'll save the completion status against the **lesson_id** instead.

### Changes

**`src/components/homework/HomeworkCompletionCheckDialog.tsx`**
- Remove the `fetchPreviousHomework` function and its `useEffect`
- Remove `isLoading` and `previousHomework` state
- Remove the loading spinner conditional render
- Remove the `if (!previousHomework) return null` guard
- Initialize student statuses immediately when dialog opens
- Update the header text to simply: "Did the following students complete their homework?"
- On save, store records with `lesson_id` instead of `homework_id` (since there may be no previous homework record to reference)
- Update `handleSave` to use `lesson_id` field instead of `homework_id`

**Migration: alter `homework_completion_status` table**
- Add `lesson_id` column (text, nullable) to `homework_completion_status`
- Make `homework_id` nullable (since we may not have one)
- Update the unique constraint to work with `lesson_id + student_id`

This ensures the dialog always appears, the tutor always marks completion, and we save the data against the lesson.

