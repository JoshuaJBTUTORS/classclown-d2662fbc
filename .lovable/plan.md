# Make calendar lesson deletion permanent

## The actual cause
Regeneration does not look at lessons to decide what to recreate. It reads the `recurring_lesson_groups` table: for every group whose next extension date is due, it loads the original "parent" lesson as a template and recreates every date in the pattern that has no matching lesson row.

The only thing that stops a date being recreated is a cancellation record keyed to that parent lesson (either a single cancelled date, or a cutoff date after which nothing is generated).

This means deleting lessons from the calendar does nothing by itself. If the deletion does not also write a cancellation record or remove the group, the group survives and regenerates the exact lessons that were just deleted.

Confirmed in the live data: there are groups still due to extend that have zero remaining lessons and zero cancellation records. Those are the ghosts. One example has 28 past instances, none in the future, and nothing recorded to stop it.

## Why the current deletion misses this
- Deletion runs as several separate browser requests. Lessons are removed first, and the cancellation record is written afterwards without checking whether it succeeded. If that last write is blocked or fails, the lessons are gone and nothing stops regeneration.
- Deleting a single occurrence only writes a cancellation when the deleted lesson is a child instance. When the deleted lesson is the parent occurrence itself, nothing is recorded.
- The cancelled date is derived from a raw UTC timestamp rather than the London calendar date, so an evening lesson can record the wrong day and fail to match on regeneration.
- Nothing ever reconciles a group whose lessons have all been deleted, so existing orphaned groups keep firing.

## Changes
1. **One atomic deletion operation**
   - Replace the multi-request browser deletion with a single secured database operation covering the three existing calendar choices: this lesson only, this and all future, entire series.
   - Write the cancellation marker or cutoff and remove the lesson rows together, so either everything commits or nothing does.
   - Derive cancelled dates from the Europe/London calendar date.
   - Report failure in the UI instead of a success toast when any part fails.

2. **Kill regeneration at its source for each choice**
   - This lesson only: record the single cancelled date against the correct parent, even when the deleted lesson is the parent occurrence.
   - This and all future: record a hard cutoff and permanently cap the group.
   - Entire series: remove the group entirely.

3. **Make the generator self-correcting**
   - Skip and permanently retire any group whose series has no remaining lessons, so it cannot resurrect a fully deleted series.

4. **Clean up the existing backlog**
   - Retire the groups that are currently due to extend but have no remaining future lessons and no cancellation record, so they stop producing ghosts.

5. **Remove the Stop Lessons detour**
   - Delete the `stop-lessons` edge function and revert the student and tutor dialogs to plain deactivation. Calendar deletion becomes the single place that controls whether lessons come back.

6. **Verify**
   - For a recurring series, run each deletion choice, then run the extension function and confirm the deleted lessons stay gone.
   - Confirm plain non-recurring deletion still works.

## Technical details
- New security-definer function handling deletion scope, cancellation records, related-record cleanup and lesson removal in one transaction.
- `extend_recurring_lessons()` gains an "empty series" guard alongside its existing tutor and student guards.
- One-off data cleanup for the orphaned groups already in the database.
