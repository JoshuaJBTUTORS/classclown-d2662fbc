# Tayana trial booking link (/book-trial-tayana)

Create a new trial booking page that is an exact copy of the Musa page, branded for Tayana.

## What changes

- New page `src/pages/TrialBookingTayana.tsx` — a copy of `TrialBookingMusa.tsx` with:
  - Heading: "Book a Trial Lesson (TAYANA)" (referral heading still overrides when a `ref` code is present)
  - Subheading: "…free 45-minute trial lesson - Tayana Referral Link"
  - Submit button: "Submit Tayana Request"
  - Message text: "Tayana trial lesson request for …"
  - `booking_source: 'tayana'` so these bookings are distinguishable in admin
  - Same 3-step flow, uniqueness check, confirmation pop-up, and referral-link support — unchanged
- New route in `src/App.tsx`: `/book-trial-tayana` → `TrialBookingTayana`

## Technical details

1. Copy `src/pages/TrialBookingMusa.tsx` to `src/pages/TrialBookingTayana.tsx` and rename the component and the Musa-specific strings listed above.
2. In `src/services/trialBookingService.ts`, the HubSpot integration is currently skipped only for `booking_source === 'musa'`. Add `'tayana'` to that skip condition so Tayana bookings behave identically to Musa bookings (no HubSpot contact created).
3. Register the route in `src/App.tsx` alongside `/book-trial-musa`.
4. No edge function, database, or email-template changes needed — the existing booking, confirmation, and sales-notification flow already works off `booking_source`.

No changes to the existing `/book-trial` or `/book-trial-musa` pages.
