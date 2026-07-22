## Problem

After a parent signs the agreement, the app is supposed to move them straight to the payment setup screen. Instead they land back on the proposal document.

## Root cause

In `src/pages/ProposalView.tsx`, `AgreementStep`'s `onAgree` handler does two things:

1. `setCurrentStep('payment')`
2. `loadProposal()` — which unconditionally runs `setCurrentStep('view')` at line 91, overwriting step 1.

So the payment screen is set for one render, then immediately replaced by the document view.

## Fix

In `src/pages/ProposalView.tsx`:

- Remove the `loadProposal()` call from `AgreementStep`'s `onAgree`. Signing already updates the proposal status server-side; the local `proposal` object doesn't need to be re-fetched to render `PaymentCaptureStep`. Just call `setCurrentStep('payment')`.
- Optionally refresh the proposal after the user finishes payment (already handled by `PaymentCaptureStep`'s `onComplete` → `loadProposal()`).

No other files need changes.

## Verification

- Open a proposal link, sign the agreement, confirm the app lands on the payment setup screen (not the document).
- Confirm the existing "signed docs stay visible for the record" behaviour still holds on subsequent visits (unchanged, because we didn't touch the initial `setCurrentStep('view')` on load).
