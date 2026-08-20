# Add clear buttons to calendar filter search inputs

## Problem

On the Calendar filters sidebar, the searchable multi-select popovers (Students, Tutors, Parents, Subjects) use `CommandInput` with only an `onInput` handler. The input is therefore uncontrolled and has no one-click way to clear the typed text. If a user mistypes a letter, they must delete characters one by one or close and reopen the popover.

## Fix

1. Convert each of the four `CommandInput` fields in `src/components/calendar/CalendarFilters.tsx` to a controlled input by binding `value` to the existing search state (`studentSearch`, `tutorSearch`, `parentSearch`, `subjectSearch`).
2. Add a small inline clear (X) button at the right end of each search input that resets the matching search state to an empty string.
3. Ensure clicking the clear button keeps focus inside the input/popover so the user can immediately retype.
4. Leave the existing selection toggling, badge rendering, and "Clear All" behavior untouched.

## Files touched

- `src/components/calendar/CalendarFilters.tsx` — controlled search inputs + per-input clear buttons.

No changes to data fetching, filter logic, or calendar event display.
