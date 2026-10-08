# Remove "Complete payment setup" from the proposal top bar

## What changes

- When a proposal is agreed but payment is not set up yet, the top bar shows only **Contact us** and **Print**. The black **Complete payment setup** button that sits next to Print is removed.
- The other ways to finish payment setup stay exactly as they are: the "Next step" banner under the top bar, the "Almost there!" panel at the end of the terms section, and the full-width bar at the bottom of the page on phone and tablet. The small "Payment setup" button in the phone top bar also stays.
- Nothing else moves: signed proposals still show the mint **Signed** badge, proposals nobody has agreed to still show **Confirm & get started**, and printing plus the discount countdown are untouched.

## Technical details

- File: `src/components/proposals/ProposalLayout.tsx`
- In the desktop action group, drop the `paymentPending` branch (lines 172-175) so that state renders no button there. The `signed` badge and the **Confirm & get started** button keep their existing conditions, so an agreed-but-unpaid parent is not offered a second "Confirm" action.
- `paymentPending` (line 128) and the `showPaymentBanner` / `onContinuePayment` wiring in `src/pages/ProposalView.tsx` stay, because the banner, the bottom panel and the mobile bar all still rely on them.

## Verification

- Open the current proposal (status `agreed`) in the preview: the top bar shows Contact us and Print only, while the "Next step" banner and the "Almost there!" panel still open payment setup.
- Open a completed proposal: the mint **Signed** badge still appears.
- Open a proposal nobody has agreed to: **Confirm & get started** still appears.
- Build passes with no new errors.
