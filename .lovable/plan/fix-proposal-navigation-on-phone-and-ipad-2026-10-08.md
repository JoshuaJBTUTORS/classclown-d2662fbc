# Fix proposal navigation on phone and iPad

## What will change
- Show the step names on phones: **Review proposal**, **Agree terms**, and **Add card**.
- Spread all three steps evenly across the full usable width on phone and iPad, removing the unused space after step 3.
- Keep the connecting lines balanced between each step.
- Add safe side spacing to the back link so its arrow and wording cannot be cut off.
- Preserve the current desktop appearance and all checkout behaviour.

## Technical details
- Update the checkout header and progress tracker layout in `ProposalCheckout.tsx`.
- Use a compact stacked marker-and-label layout on phones, with labels wrapping safely when needed.
- Check agreement and payment screens at phone and tablet widths for clipping, alignment, and full-width distribution.
