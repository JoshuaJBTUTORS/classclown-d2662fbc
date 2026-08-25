# Count submitted resources towards lesson completion

Right now a lesson only counts as complete when attendance is marked **and** homework exists for it. Since the completion flow in the calendar dialog now asks tutors to submit resources instead of homework, uploading resources does not turn the lesson green.

## What changes

A lesson counts as complete when:
- every enrolled student has attendance marked, AND
- the lesson has at least one submitted resource **or** homework (homework kept so historic lessons stay complete).

This makes the calendar tick/green state and any "completed lessons" lists match the new two step flow.

## Where

- `src/hooks/useLessonCompletion.ts` — also batch-fetch `lesson_resources` by `lesson_id`, add `hasResources`, and change the completion rule to `attendance complete && (hasHomework || hasResources)`.
- `src/services/lessonCompletionService.ts` — same rule in `isLessonCompleted` and in `getCompletionDataForLessons` / `filterCompletedLessons` (add a resources fetch and set alongside the homework set).
- `src/hooks/useCalendarData.ts` — no change needed; it reads `isCompleted` from the hook.

No database or UI layout changes; the completion checklist in the lesson dialog already tracks resources.
