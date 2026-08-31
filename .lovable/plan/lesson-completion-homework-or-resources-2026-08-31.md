# Lesson completion: homework OR resources

## Current state (verified)

The shared completion rules already accept either:

- `src/services/lessonCompletionService.ts` (used by payroll, earnings and reports) requires: students enrolled + all attendance marked + (`homework` exists OR `lesson_resources` exist).
- `src/hooks/useLessonCompletion.ts` (used by the calendar completion badges) applies the same OR rule.

So payroll, earnings, reports and the calendar badges already count older homework-only lessons as complete.

The one place that is out of step is the lesson modal.

## The gap

In `src/components/calendar/LessonDetailsDialog.tsx` the "Lesson Completion Progress" card's second step is keyed only on `hasResources`. A lesson completed before the switch — attendance marked and homework assigned, no resources — shows "Submit Resources: Pending" even though every other part of the system counts it complete. That's the mismatch that makes it look broken.

## What changes

Only the modal's completion checklist:

- Step 2 becomes satisfied when **either** resources have been submitted **or** homework is assigned for the lesson.
- Label reads "Submit Resources" with the sub-line reflecting whichever is present:
  - resources present: "N resources submitted"
  - no resources but homework present: "Homework assigned"
  - neither: "Not submitted yet"
- The chip flips to Complete in both satisfied cases.

Nothing else moves: the Submit Resources button, the homework section, attendance, and all logic stay exactly as they are. Tutors on an old homework-only lesson can still add resources if they want.

## Technical notes

- `LessonDetailsDialog.tsx` already has `homeworkStatus.exists` and `hasResources` in scope; derive `const resourcesStepDone = hasResources || homeworkStatus.exists` and use it for the icon, sub-line and chip on that row.
- No changes to `lessonCompletionService.ts`, `useLessonCompletion.ts`, `earningsService.ts`, `salaryCalculationService.ts` or the report components — they already implement the OR rule.
- No schema or migration changes.
