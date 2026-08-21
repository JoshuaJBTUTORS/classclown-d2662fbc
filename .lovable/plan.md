# Fix the existing trial-to-active onboarding conversion

## Confirmed issue

The existing `create-parent-account` function is already intended to convert trial students to active. For Glory Anthony, the live records show:

- Parent account was created successfully from the proposal.
- Proposal email: `gloryenorgieanthony@gmail.com`.
- Trial student email: `gloryirhene2015@gmail.com`.
- Both records use the same phone number.
- Student 918 remains unlinked with `status = trial`, `account_type = trial`, and `trial_status = pending`.

The existing function currently:

1. Finds the student only by matching the proposal/parent email or an existing parent link, so Glory was never selected because the emails differ.
2. For selected students, changes only `status` to `active`; it does not convert `account_type` from `trial` to `regular` or clear `trial_status`.

## Changes

### 1. Correct the existing matching logic

Update `create-parent-account` to find the existing trial student using:

1. Exact normalized email match.
2. Exact normalized phone match when the email differs.
3. Existing `parent_id` association.

Phone matching will ignore spaces, punctuation, and UK `+44` versus leading `0` formatting. Name matching will not automatically change records, avoiding accidental links between people with similar names.

### 2. Complete the trial-to-active conversion

For every matched family student that is currently a trial, update the existing record in one operation:

- `parent_id` → newly created/reused parent row
- `status` → `active`
- `account_type` → `regular`
- `trial_status` → cleared

Then re-read the records and fail the onboarding request visibly if any matched student remains marked as trial in any of those fields.

### 3. Report the result accurately

Return and display the number of students linked and fully converted. Do not show onboarding Step 1 as successfully complete when no student was matched; instead show a clear message that the parent was created but no trial child could be converted.

### 4. Repair Glory Anthony

Run the corrected conversion for the existing records, linking student 918 to parent `f555a824-6454-40f4-9548-68834fcaa0bd`, setting the student to active/regular, and clearing the pending trial state. Verify the persisted values afterward.

## Files and data

- Update `supabase/functions/create-parent-account/index.ts`.
- Update the Step 1 result handling in `src/pages/Onboarding.tsx`.
- No schema change is needed.
- Apply a one-off data update to the existing Glory Anthony student record after the code fix.
