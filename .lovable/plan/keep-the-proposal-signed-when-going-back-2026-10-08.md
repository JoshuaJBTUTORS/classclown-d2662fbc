# Keep the proposal signed when going back

## What's wrong
After a parent agrees to the terms, the signature is saved, but the page keeps its old copy of the proposal (still marked "not signed"). So when they press Back, the proposal (and the terms step if they re-enter) shows as unsigned again, and they could be asked to sign a second time.

## Fix
- The moment the terms are agreed, the page updates its own copy of the proposal to "agreed" with the agreed date.
- Going back from the card step to the terms shows the ticked, locked "Agreed on [date]" box with **Continue**.
- Going back further to the proposal shows it as signed, with the timer still running and the "Complete payment setup" button to resume on the card step.
- No second signature is ever created.

## Technical details
- `ProposalCheckout.tsx`: new `onAgreed(agreedAt)` prop, called from AgreementStep's `onAgree` after a fresh signature. Derive `alreadyAgreed` from the (updated) proposal status as well as local state.
- `AgreementStep.tsx`: pass the saved `agreed_at` timestamp to `onAgree`.
- `ProposalView.tsx`: handle `onAgreed` by `setProposal(p => ({ ...p, status: 'agreed', agreed_at }))`.
- Browser check: agree, go to card, Back to terms (still signed), Back to proposal (signed), Complete payment setup (card step). Stop before saving a card.
