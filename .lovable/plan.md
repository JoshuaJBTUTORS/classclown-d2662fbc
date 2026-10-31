# Add a 6 month contract option to lesson proposals

## What changes
- The contract term picker on the proposal form (create and edit) gets a new "6 Months" choice, between 3 and 12 months.
- The proposal page families see shows "6 months" / "6 Months" wherever the term appears (summary box, pricing, terms text).
- Proposals drafted from a lesson transcript can pick 6 months too.

## Technical details
- Migration: replace `lesson_proposals_contract_term_check` to also allow `'6_months'`.
- Add `'6_months'` to the term types/zod enum in ProposalForm.tsx, ProposalBuilder.tsx, EditProposal.tsx, TranscriptProposalDialog.tsx (normaliseTerm: check "6" before "3"), ProposalLayout.tsx (3 label spots).
- Edge functions create-lesson-proposal, update-lesson-proposal, draft-proposal-from-transcript: add `'6_months'` to allowed values; redeploy.
- Pricing per lesson is entered manually, so no price rules change.
