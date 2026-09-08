# Update clause 16 of the proposal Terms & Conditions

## What changes
Replace clause 16 ("Termination") in the signed agreement text with the new contract-term wording supplied by the user.

### Current clause 16
> 16. Termination
> Either party may terminate this agreement with 1 month (30 days) written notice. Prepaid fees for unused lessons will be refunded on a pro-rata basis, less any administrative fees.

### New clause 16
> 16. Contract Term & Renewal
> During the agreed contract term, the number of sessions cannot be reduced and the plan cannot be downgraded. You may increase the number of sessions or upgrade your plan at any time.
>
> At the end of the contract term, the agreement will automatically renew. If you wish to cancel, reduce the number of sessions, or downgrade your plan, you must provide at least 30 days' written notice before the end of the current term.
>
> All prepaid lessons are non-refundable and must be used within the applicable contract period. No pro-rata refunds will be issued for unused lessons.

## Where
- `src/components/proposals/AgreementStep.tsx` — the `TERMS_AND_CONDITIONS` constant, clause 16 block (lines 169–170). This is the text stored verbatim in the signed agreement record when a parent accepts.

## Notes
- The client-facing proposal display (`ProposalLayout.tsx` "Cancellations & term" paragraph) already covers similar ground with different wording; it is not the "terms and conditions page" the user referenced, so it is left untouched.
- This is a wording-only change. No schema, edge function, or form changes are needed.
