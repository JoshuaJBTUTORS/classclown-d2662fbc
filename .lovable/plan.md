# Stop "add student" from moving future lessons, and put the moved lessons back

## What's happening

When a student is added and "all future lessons" is chosen, the edit screen always resends the lesson time, even if nobody changed it. The app then recalculates every future lesson's time using the computer's own clock/timezone instead of strictly UK time. On a computer not set to UK time, every lesson shifts by that timezone gap — which is why one group jumped 10 hours (Fri 6pm to Sat 4am) and GCSE Chemistry jumped 5 hours (Mon 6pm to 11pm). Different gaps point to the edits being made from computers in different timezones.

## Fix

1. **Only change times when times actually changed** — if the start/end time and day match the original, adding or removing students leaves every lesson's time untouched.
2. **Always calculate in UK time** — rewrite the time helpers so results are identical no matter where the person editing is located, including around clock changes.
3. **Repair affected lessons** — find all recurring series whose future lessons no longer match their series' set day/time (Iulian's Year 11 Physics, Monday GCSE Chemistry, and any others from today), and move them back to their correct UK day and time, keeping students (including Abdurahman) as added.
4. **Check** — re-run an "add student to all future" edit with the computer set to a non-UK timezone and confirm no times move; confirm the calendar shows Friday 6pm and Monday 6pm again.

## Technical details

- `src/utils/timezone.ts` `createUKDateTime`: replace `toZonedTime(new Date(localIso))` with `fromZonedTime(isoString, UK_TIMEZONE)` (returns true UTC); read hours/minutes via `formatInTimeZone(..., 'HH:mm')` instead of `getHours()`.
- `src/services/recurringLessonEditService.ts` `applyTimeUpdatesToInstance` / `updateAllFutureLessons`: derive UK date with `formatInTimeZone(instance.start_time, UK, 'yyyy-MM-dd')`, build new times with `fromZonedTime`; set `hasTimeChanges` only when UK HH:mm or weekday differs from the original lesson; compute day delta with UK weekday strings.
- `src/components/lessons/EditLessonForm.tsx` (~line 311): same UK-safe construction; omit `start_time`/`end_time` from the update when unchanged.
- Data repair via SQL: for instances updated today whose UK weekday/time differs from the parent's `recurrence_day`/original time, reset to the series time on the intended date.
