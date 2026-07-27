Replace the assessment `Select` in the Assessment Week dialog with a searchable combobox so the search bar is clearly visible.

## Changes
- `src/components/calendar/LessonDetailsDialog.tsx`
  - Remove the current `Input` + `Select` combo for the Assessment field.
  - Replace with a shadcn Combobox pattern: `Popover` + `PopoverTrigger` (Button showing selected assessment title or "Select an assessment") + `PopoverContent` containing `Command`, `CommandInput` (placeholder "Search assessments..."), `CommandEmpty`, and `CommandGroup`/`CommandItem` list.
  - Each `CommandItem` shows title + subject/exam board/year subtitle; selecting one sets `selectedAssessmentId` and closes the popover.
  - Command's built-in filter handles searching by title/subject/board/year via the item `value`.
  - Add imports: `Popover, PopoverContent, PopoverTrigger`, `Command, CommandInput, CommandEmpty, CommandGroup, CommandItem, CommandList`, `ChevronsUpDown` icon.
  - Keep existing tutor Select and due date input unchanged.

No backend or business-logic changes.