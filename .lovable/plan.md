# Make calendar lesson deletion permanent

## Goal
Deleting a lesson from the calendar must be the only workflow needed. A deleted occurrence or recurring series must never reappear after the recurring lesson job runs.

## Changes
1. **Make calendar deletion atomic**
   - Move the three existing calendar choices into one database operation: delete this lesson, delete from this date onward, or delete the whole recurring series.
   - Record the recurrence cancellation or cutoff before removing lesson rows, in the same transaction.
   - Use the lesson's Europe/London calendar date so daylight-saving and UTC boundaries cannot record the wrong occurrence.
   - Fail the whole operation if any cancellation, cutoff, related-record cleanup, or lesson deletion fails; the UI must not report success for a partial deletion.

2. **Prevent regeneration at the source**
   - Keep single-occurrence cancellation dates for “delete this lesson only.”
   - Permanently cap the recurring group for “delete from this date onward.”
   - Remove the recurring group for “delete the whole series.”
   - Ensure `extend_recurring_lessons()` respects each marker and cannot recreate matching deleted dates.

3. **Use only the calendar delete dialog**
   - Keep the current three deletion choices in the calendar lesson dialog.
   - Replace its multi-call browser deletion service with the atomic database operation and refresh the calendar after success.
   - Remove the newly introduced “Stop Lessons” student workflow and its `stop-lessons` edge function; student deletion/deactivation will no longer be responsible for calendar recurrence behavior.
   - Restore tutor deactivation to its normal account-status behavior rather than using the `stop-lessons` function.

4. **Verify the exact behavior**
   - Test a recurring lesson with each deletion choice.
   - Run the recurring extension function after deletion and confirm: one deleted occurrence stays absent, future occurrences stay absent after a cutoff, and a deleted series stays absent.
   - Confirm ordinary non-recurring lesson deletion still works and the calendar refreshes correctly.

## Technical details
- Add a secured database function for calendar deletion so cancellation markers and deletions commit or roll back together.
- Preserve existing lesson history outside the scope explicitly selected in the calendar dialog.
- No new page or separate stop button will be added.