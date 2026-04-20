

## Fix: Changing the day on a recurring lesson doesn't update future instances

### The bug
When you edit a recurring lesson and change its day (e.g. Monday → Wednesday) using "All Future Lessons", the day doesn't change. Only the **time of day** updates — every instance keeps its original date.

### Root cause
In `src/services/recurringLessonEditService.ts`, the helper `applyTimeUpdatesToInstance` (lines 169-194) does this for every future instance:

1. Reads the existing instance's date (`new Date(instanceLesson.start_time)`)
2. Pulls only the **hours/minutes** from the new start/end time
3. Rebuilds the timestamp using the **old date** + **new time**

So the new day-of-week selected in the form is thrown away. On top of that, we never update `recurrence_day` on the parent lesson, so the recurring rule itself still says e.g. "Monday".

### The fix

**1. Shift each instance to the new day-of-week (preserve the week)**

Update `applyTimeUpdatesToInstance` so that when the new start time falls on a different day-of-week than the original lesson, each instance is shifted by the day delta within its own week. Example: original Mondays → new Wednesdays = shift every instance's date by +2 days, then apply the new time-of-day.

```text
old instance:  Mon 2026-04-13 16:00
new template:  Wed 16:30
shifted:       Wed 2026-04-15 16:30   ← +2 days, new time
```

This keeps each weekly instance in its correct week and only moves the weekday.

**2. Update `recurrence_day` on the parent lesson**

In `updateAllFutureLessons`, when the day-of-week changes and we're editing the original (parent) lesson, also write the new `recurrence_day` (e.g. `"Wednesday"`) so future auto-generated instances use the new day.

**3. Edge case: collisions with already-existing instances on the new day**

When shifting (e.g. Mon → Wed), it's possible an instance's new date overlaps another future instance's date. We'll handle this by simply applying the shift per-instance — duplicates are unlikely because all instances were on the same old weekday — but we'll add a console warning and let the existing duplicate-prevention in the DB handle conflicts.

### Files to change
- `src/services/recurringLessonEditService.ts` — fix `applyTimeUpdatesToInstance` to detect day-of-week change and shift instance dates; update `updateAllFutureLessons` to write `recurrence_day` on the parent lesson when it changes.

### Out of scope
- "This lesson only" edits already work correctly (they pass the full new datetime through).
- No DB migration required — `recurrence_day` already exists.

