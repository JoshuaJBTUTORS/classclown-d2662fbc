# Surface referral attribution in the trial bookings admin view

## Goal
Make it obvious in the admin trial bookings list when a trial booking came from a referral, so the team can track refer-a-friend conversions without querying the database manually.

## Current state
- `trial_bookings.referral_code` already exists and is populated when someone books via a `?ref=CODE` link.
- A `link-trial-referral` edge function updates the `referrals` table to `status = 'trial_booked'` and stores `trial_booking_id`.
- The admin `/trial-bookings` page fetches `*` from `trial_bookings`, but the `TrialBooking` interface does not include `referral_code`, so the value is not displayed or filterable.
- At time of writing, there are 841 trial bookings and 0 have a `referral_code` stored.

## Plan
1. **Update the admin data model**
   - Add `referral_code?: string` to the `TrialBooking` interface in `src/pages/TrialBookings.tsx`.
   - Add it to any detail view state so it can be shown in the booking dialog.

2. **Show referral status in the table**
   - Add a new column (or compact badge) that shows a "Referred" badge when `referral_code` is present.
   - Include the actual code in a tooltip or small mono text so staff can cross-reference it with the `referrals` table or the referrer.

3. **Add a referral filter**
   - Add a toggle/tab/filter option for "Referred only" / "Not referred" alongside the existing source/status filters.
   - Update `filterBookings()` to include this new criteria.

4. **Show attribution in the booking details dialog**
   - When opening a booking's detail view, display the referral code and a note that this booking came from a referral link.
   - Optional: if the code maps to a user profile via `referral_codes.user_id`, show the referrer's name (fallback to code only if guest referral).

5. **Keep data changes read-only**
   - No schema changes are required; this is a UI/read-only enhancement on existing columns.

## Acceptance criteria
- The `/trial-bookings` admin table clearly marks rows that have a `referral_code`.
- Staff can filter the list to show only referred bookings.
- The booking details dialog shows the referral code and referrer name where available.
- Existing non-referred bookings remain unchanged.
