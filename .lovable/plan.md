# Fix month / week / day buttons on the calendar

## Problem

The three view buttons in the top right of the Calendar page update a piece of page state (`currentViewType`) but that state is never passed to the calendar component. The calendar is created once with a fixed starting view (week) and is never told to change, so clicking the buttons does nothing visible.

## Fix

1. Pass the selected view from `src/pages/Calendar.tsx` down to `src/components/calendar/CalendarDisplay.tsx`.
2. In `CalendarDisplay`, hold a ref to the FullCalendar instance and, whenever the selected view changes and differs from the current one, call `changeView(...)` so the grid actually switches between month, week and day.
3. Keep the existing `datesSet` callback working: it reports the view back up, so guard the change so the two do not fight each other (only call `changeView` when the requested view differs from the calendar's active view).

## Duplicate controls

FullCalendar also renders its own month/week/day buttons in its internal header bar, so the page currently shows two sets of controls. With the top-right buttons working, the built-in set will be removed from the calendar's header toolbar (prev/next/today and the title stay), leaving one working set.

## Files touched

- `src/pages/Calendar.tsx` — pass `viewType={currentViewType}` to `CalendarDisplay`.
- `src/components/calendar/CalendarDisplay.tsx` — add `viewType` prop, calendar ref, effect calling `changeView`, drop the duplicate view buttons from `headerToolbar`.

No changes to data fetching, filters, teacher view, or lesson logic.
