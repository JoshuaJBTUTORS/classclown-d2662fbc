# More breathing room in the "Almost there!" panel on phone and iPad

## What will change
- Increase the space between the "Almost there!" text and the "Complete payment setup" button on phone and iPad widths, so they no longer sit almost touching.
- Keep the button at its natural size (it will not get squeezed) and let the text take the remaining width.
- Apply the same spacing to the matching "Ready to get started?" panel so both end-of-page panels look consistent.
- Desktop keeps its current side-by-side layout; nothing about checkout behaviour changes.

## Technical details
- In `src/components/proposals/ProposalLayout.tsx`, on the two end-of-page CTA panels (the `paymentPending` "Almost there!" branch and the default "Ready to get started?" branch, around lines 662–680):
  - Change the panel gap from `gap-4` to `gap-6 md:gap-8`.
  - Add `shrink-0` to the Button so it keeps its full size at narrow widths.
- Verify with Playwright at phone (392px) and iPad (833px) widths that the text and button have clear separation and nothing clips.
