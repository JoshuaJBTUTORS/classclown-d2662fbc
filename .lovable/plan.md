## Goal
When a proposal has been signed (agreed/completed), keep showing the full proposal document exactly as it appeared before signing, but clearly mark it as SIGNED so both the client and Class Beyond have a permanent visual record.

## Current behaviour
- `status = 'sent' | 'viewed'` → full `ProposalLayout` is shown.
- `status = 'agreed'` → jumps straight into `PaymentCaptureStep` (document hidden).
- `status = 'completed'` → replaced by a small "Welcome to Class Beyond" confirmation screen (document hidden).

The signed document is effectively lost from the client's view once they progress.

## Changes (all in `src/pages/ProposalView.tsx` + `src/components/proposals/ProposalLayout.tsx`)

1. **Always render `ProposalLayout` for viewed / agreed / completed statuses.** Remove the early-return "Welcome" screen and the auto-jump into payment for `agreed`/`completed`.

2. **Add a `signed` visual state to `ProposalLayout`:**
   - Pass a new `signed` prop (true when status is `agreed` or `completed`) plus `signedAt` (from `agreed_at`).
   - Top action bar: replace the "Confirm & get started" button with a green "Signed on {date}" pill + a "Download / Print" button that still calls `window.print()`.
   - Add a subtle "SIGNED" ribbon in the top-right corner of the Overview hero card and a matching status line in the Prepared-by card ("Agreement accepted by {recipient_name} on {date}").
   - Diagonal `SIGNED` watermark behind the content (low opacity, `print:opacity-40`) so printed/PDF copies clearly show it.
   - Hide the interactive "Add Daily Homework" toggle in Pricing when signed; instead show a read-only line reflecting `daily_homework_opt_in`.

3. **Preserve the payment flow without hiding the document:**
   - For `status = 'agreed'` (signed but payment not yet captured), render `ProposalLayout` in signed mode and show a slim banner at the top: "Next step: complete payment setup" with a button that opens `PaymentCaptureStep` (existing component, unchanged) in a full-screen overlay/route step — same trigger logic as today, just user-initiated instead of automatic.
   - For `status = 'completed'`, no payment banner; just the signed document with a small success note in the Overview section.

4. **No changes to:** DB schema, RLS, `AgreementStep`, `PaymentCaptureStep`, signatures table, or the pre-signing flow.

## Technical notes
- `signedAt` source: `proposal.agreed_at` (already on the row).
- Print styles: add `@media print` rules in the layout file so sidebar/top-bar hide and the SIGNED watermark stays visible.
- Scroll-spy sidebar keeps working unchanged.

## Verification
- Playwright headless (1280×1800) against a proposal in each status: `viewed`, `agreed`, `completed`. Screenshot each; confirm the full document renders in all three, the SIGNED ribbon + watermark appear for agreed/completed, and the payment banner only appears for `agreed`.
