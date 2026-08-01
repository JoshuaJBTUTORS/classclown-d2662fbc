## Goal

The weekly schedule table overflows on phones (Subject and Price columns get cut off). Make it mobile friendly.

## Change

`src/components/proposals/ProposalLayout.tsx` — weekly schedule section only:

1. **Mobile (below `md`)**: replace the table with a stacked card list, one card per session:
   - Top row: day (bold) on the left, price (bold) on the right.
   - Second row: time and duration as a muted line, e.g. `17:00 · 60 min`.
   - Third row: subject.
   - Cards separated by the existing border style inside the same rounded container, so it visually matches the rest of the proposal.

2. **Desktop (`md` and up)**: keep the current table exactly as it is (Day / Time / Duration / Subject / Price), just hidden on mobile.

Both views read from the same `proposal.lesson_times` data and the existing `rowPrice()` helper, so no content or pricing logic changes. All styling uses existing semantic tokens (`border-border`, `text-muted-foreground`, `bg-muted/60`).

No other sections, backend, or data changes.
