# Proposal: discount timer until fully finished, one continuous sign-up flow

## 1. Discount timer keeps running until the end
Right now the countdown disappears as soon as the parent ticks the terms ("agreed"), even if they never add their card.

- The timer stays visible and counting on the proposal until the card is saved too (proposal fully "completed").
- If a parent agreed but didn't add a card, they still see the timer plus the "Complete payment setup" prompt, so they know the offer can still run out.
- The timer also shows at the top of the terms and card screens, so the pressure stays the same the whole way through.

## 2. One continuous "Finish sign-up" flow
Today: Confirm & get started, then a separate terms page ("I Agree – Continue to Payment Setup"), then a separate card page ("Almost There!"). That feels like three disconnected pages.

New flow, a single checkout screen with a simple progress bar at the top:

```text
 (1) Review proposal  ──  (2) Agree terms  ──  (3) Add card  ──  Done
```

- Clicking **Confirm & get started** opens the checkout on step 2. The terms box, checkbox and £0.00 notice match the new black/white/mint proposal style.
- Ticking the box and pressing **Agree & continue** saves the signature and slides straight into step 3 on the **same screen**. It doesn't jump to a new page, show an extra "Confirm & set up payment" button, or ask them to click again.
- Step 3 keeps the £0.00 Authorisation notice at the top, then the card fields, then **Save card & finish**.
- A small summary stays visible throughout (child's name, lessons per week, price per lesson, countdown), so parents always know what they're signing up for.
- After the card is saved, a clear "You're all set" confirmation shows. Then they go back to the signed proposal, and the timer is gone.
- "Back" goes to the previous step instead of throwing them out to the proposal.

## Technical details
- `ProposalLayout.tsx`: show countdown when `proposal.status !== 'completed'` (not `!signed`).
- New `ProposalCheckout.tsx` wrapper: stepper, sticky summary with countdown (reuses `resolveDiscountDeadline`), and steps rendered inline with a fade/slide transition.
- `AgreementStep.tsx` and `PaymentCaptureStep.tsx` get an `embedded` mode (no outer page/card, restyled to the black/white/mint tokens). Signature saving, Stripe SetupIntent and the database updates stay exactly the same.
- `ProposalView.tsx`: `'agreement' | 'payment'` steps both render `ProposalCheckout`. Parents who agreed but didn't add a card resume straight on step 3.
- Check the full path in a browser on desktop and mobile using a test proposal, up to the card step (no real card saved).
