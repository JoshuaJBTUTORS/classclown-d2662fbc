# Signed indicator only after full completion

## Current behaviour
In `src/pages/ProposalView.tsx` the `signed` value passed to `ProposalLayout` is true when status is `'agreed'` OR `'completed'`. So a parent who agreed to terms but hasn't finished payment setup already sees:
- the giant rotated **SIGNED** watermark across the page
- the mint "Signed · date" badge in the header (desktop + mobile)
- the mint "Agreement signed on [date]" panel at the bottom
- "Download / Print" wording

## Desired behaviour
"Signed" treatment appears only when the **whole proposal is completed** (card saved, status `'completed'`). A parent who agreed but hasn't added a card still sees the proposal as un-signed — with a clear way to finish payment.

## Changes

### 1. `src/pages/ProposalView.tsx`
- Change `isSigned` to `proposal.status === 'completed'` (was `'agreed' || 'completed'`).
- `showPaymentBanner` stays `proposal.status === 'agreed'` (drives the "Complete payment setup" prompts).

### 2. `src/components/proposals/ProposalLayout.tsx`
The agreed-but-not-paid parent must not be shown "Confirm & get started" again (that would restart agreement). Instead the CTAs route to payment:
- **Desktop header button** and **footer CTA block**: when not signed but `showPaymentBanner && onContinuePayment`, render a "Complete payment setup" button calling `onContinuePayment` (instead of "Confirm & get started" calling `onConfirm`).
- **Mobile sticky CTA**: already handles the payment-banner case — unchanged.
- **Mobile header**: same treatment as desktop (Complete payment setup instead of Confirm).
- The bottom "Ready to get started?" block gets the same conditional: payment-setup variant when agreed, plain confirm variant otherwise.

## Unchanged
- Signature saving, Stripe payment setup, database statuses and the checkout stepper (`ProposalCheckout`) are untouched.
- Mint/grey styling tokens and all other copy stay the same.
- Parents who already completed everything see exactly the same signed page as now.

## Verification
- Build check.
- Playwright on the live proposal link: view an agreed-but-not-completed proposal (no SIGNED watermark, no Signed badge, "Complete payment setup" buttons present), and a completed proposal (watermark, badge, signed panel all present).
