# Skip Assessment Week lessons when generating future sessions

## Problem
When a lesson is set to Assessment Week (the button in the lesson pop-up), it is moved to the assessment tutor and the shared assessment room. When the calendar later generates new future sessions for that series, it copies the **most recent past lesson**. If that lesson was the assessment week, the new sessions can inherit the wrong title/students, and the "fallback tutor" logic can pick up the assessment tutor instead of the regular tutor.

Today 38 lessons are tagged this way (36 of them inside a recurring series).

## What changes
- When choosing which lesson to copy for new sessions, any Assessment Week lesson is skipped — it uses the most recent **normal** lesson before it (the week prior). If several assessment weeks are in a row, it keeps going back.
- When the regular tutor is inactive and the system looks for a replacement tutor from past lessons, assessment-week lessons are also ignored, so the assessment tutor never takes over a series.
- The Assessment Week lessons themselves are left exactly as they are.
- The same rule is applied to the "generate next batch" path used from the app, so both routes behave the same.

## Technical details
- An Assessment Week lesson is identified by `lesson_space_room_id = '2670b244-b11f-4be3-8336-32bb2ce558e9'` (the shared room the button sets). No new column needed.
- Migration: `CREATE OR REPLACE FUNCTION public.extend_recurring_lessons()` — add `AND COALESCE(lesson_space_room_id,'') <> '<room id>'` to the template query and to the inactive-tutor fallback query. Rest of the function unchanged.
- `src/services/recurringLessonService.ts` `generateNextBatchOfInstances`: exclude that room id when picking `lastInstance` (`.or('lesson_space_room_id.is.null,lesson_space_room_id.neq.<id>')`).
- Move the room id into a shared constant (`src/constants/assessmentRoom.ts`) used by `LessonDetailsDialog.tsx` and the service.
- Record the rule in `AGENTS.md`; verify by reading back the deployed function definition and checking which template each of the 36 affected series would now pick.
