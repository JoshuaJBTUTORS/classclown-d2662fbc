# Proposal checkout: Back and Next buttons on every step

## What parents will see
Every step gets the same two buttons at the bottom: **Back** (one step back) and **Continue** (one step forward). Going back never undoes anything already done.

- **Terms step:** Back goes to the proposal. If they haven't signed yet, Continue reads **Agree & continue**. It signs the terms and moves to the card step, the same as now. If they've already signed (for example after coming back from the card step), the box shows as ticked and locked with "Agreed on [date]". Continue then just moves to the card step, with no second signature.
- **Card step:** Back goes to the terms, which still show as signed. Continue reads **Save card & finish** and works the same as now.
- **Proposal page (already signed, no card yet):** the existing "Complete payment setup" button does the forward job and opens the card step.
- The top "Back to proposal" link changes to match the step: "Back to terms" on the card step.

## Technical details
- `ProposalCheckout.tsx`: keep `isAgreed` state, starting from `proposal.status` being agreed or completed and set to true after signing. Top link and step `onBack`: agreement goes to `onBackToProposal`, payment goes to `setStep('agreement')`. Pass `alreadyAgreed={isAgreed}` to AgreementStep.
- `AgreementStep.tsx`: new `alreadyAgreed` prop. When true, the checkbox is checked and disabled, a mint "Agreed" note shows, and the primary button reads "Continue" and calls `onAgree()` without inserting a signature or updating the status.
- `PaymentCaptureStep.tsx`: add an optional `onBack` prop. In embedded mode, show an outline **Back** button next to "Save card & finish".
- Check in the browser from terms to card, back to terms (shown as signed), then forward again. Stop before saving a real card.
