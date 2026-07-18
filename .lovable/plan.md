## Problem
The proposal hero paragraph is hardcoded to "A dedicated 1-to-1 tuition programme…" and shows on every proposal, including group lesson proposals.

## Change
In `src/components/proposals/ProposalLayout.tsx` (line 283-286), make the hero paragraph conditional on `proposal.lesson_type`:

- **`one_to_one`** (or default): "A dedicated 1-to-1 tuition programme designed around your child's goals, exam board and pace, delivered by subject specialists we've hand-picked."
- **`group`**: "A focused small-group tuition programme aligned to your child's exam board and pace, delivered by subject specialists we've hand-picked."

No other sections change. Lesson-type value is already stored on the proposal and passed into the layout.

## Question
Do you want me to also sweep the rest of the document (Terms, Included checklist, Pricing labels, mobile sticky CTA) for other "1-to-1" wording and make them group-aware in the same pass, or only fix this hero line for now?
