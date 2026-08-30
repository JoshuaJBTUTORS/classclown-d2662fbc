# Add phone number to time-off notice

Update the "Please note" banner in the tutor `/time-off` request form (`src/pages/TimeOff.tsx`, line ~230) to include the contact phone number, matching the wording the user specified.

## Change
Current text:
> Please note: A minimum of 1 week notice is required. If lessons are affected, please give a team member a call.

New text:
> Please note: A minimum of 1 week notice is required. If lessons are affected, please give a team member a call - 01438582848.

That is, append `- 01438582848` to the existing sentence. No other text, logic, validation, or styling changes.

## What stays the same
- The 6-day minimum notice validation, dialog, form fields, mutation, role gating, and all other page behaviour.
