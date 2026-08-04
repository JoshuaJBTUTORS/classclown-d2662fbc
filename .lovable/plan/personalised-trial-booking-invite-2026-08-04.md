# Personalised trial booking invite

When someone opens a referral link (`/book-trial?ref=CODE` or the Musa version), the page should greet them by the referrer's name instead of the generic heading.

## What changes

- Heading becomes: "Sarah has invited you to book a trial with Class Beyond Academy"
- Subheading keeps the existing line about the free 45-minute trial, with a short note that both families get £50 when the trial goes ahead.
- If no `ref` code is present, or the code is unknown, the page shows the current default heading exactly as today (no flash of wrong text while resolving).

## Technical details

1. New edge function `resolve-referral-code` (public, no JWT): takes a code, looks it up in `referral_codes`, and returns only the referrer's first name (from their profile/auth metadata). Nothing else is exposed. Unknown codes return `{ found: false }`.
   - The trial page is anonymous, so it cannot read `referral_codes` directly under RLS; the function uses the service role and returns a minimal payload.
2. Small hook `useReferrerName(code)` in `src/hooks/` that calls the function once on mount and caches the result.
3. `src/pages/TrialBooking.tsx` and `src/pages/TrialBookingMusa.tsx`: read `ref` from the query string once at the top, pass it to the hook, and render the personalised heading when a name is returned.
4. No change to the existing attribution flow — `referral_code` is still submitted with the booking and linked by `link-trial-referral`.
