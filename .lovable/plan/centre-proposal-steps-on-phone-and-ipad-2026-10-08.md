# Centre proposal steps on phone and iPad

## What will change
- Add balanced left and right spacing around the proposal progress steps on phone and tablet widths.
- Keep the three steps evenly distributed so the first step no longer sits against the left edge.
- Preserve the current desktop layout, labels, progress states, and checkout behaviour.

## Technical details
- Update the responsive spacing and sizing of the step list in `ProposalCheckout.tsx` only.
- Check the proposal agreement screen at phone and iPad widths to confirm the steps are centred and remain on one line without clipping.
