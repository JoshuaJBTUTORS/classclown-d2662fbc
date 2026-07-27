Add a search bar to the assessment selector in the "Assessment Week" dialog on the calendar's Lesson Details.

## Changes
- `src/components/calendar/LessonDetailsDialog.tsx`
  - Add `assessmentSearch` state (string).
  - Above the assessment `<Select>` in the Assessment Week dialog, render a small `<Input>` with placeholder "Search assessments..." bound to `assessmentSearch`.
  - Filter `assessmentsList` by title (case-insensitive) when rendering the `SelectItem` list.
  - Reset `assessmentSearch` when the dialog opens/closes.

No backend or business-logic changes.