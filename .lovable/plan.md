## Goal
Bring `/book-trial-musa` in line with `/book-trial`, while keeping its MUSA-specific behaviour.

## Changes (all in `src/pages/TrialBookingMusa.tsx`)

1. **Require phone number**
   - In the step-3 validation, add `if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';` so users can't proceed without it (matching `/book-trial`).

2. **Courtesy confirmation pop-up before submit**
   - Import the `AlertDialog` components and add a `showConfirmDialog` state.
   - Change the final "Submit Request" button to open the dialog instead of submitting directly.
   - Dialog text (identical to `/book-trial`): the "Thank you for considering Class Beyond Academy… we look forward to welcoming you!" courtesy message.
   - Confirm action calls the existing `handleSubmit`; cancel closes the dialog with no submission.

## Kept unchanged (MUSA-specific)
- Email/phone uniqueness check with the green/amber alert.
- `booking_source: 'musa'` and `is_unique_booking` fields on the insert.
- "(MUSA)" heading and referral copy, and its toast wording.

No backend or database changes — both pages already insert into the same `trial_booking_requests` table and share the same downstream approval/notification flow.