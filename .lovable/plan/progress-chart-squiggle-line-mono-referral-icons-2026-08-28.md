# Progress chart: squiggle line + mono referral icons

## Homework by month
- Replace the bars with a hand-drawn squiggle line graph: a smooth, slightly wobbly curve through each month's average, with a soft filled area beneath it.
- Colour: one extremely light blue, fully opaque (no transparency), used for both the fill and a slightly deeper blue for the line itself.
- Remove the percentage labels sitting above each month.
- Keep the month arrows, average baseline with the "avg" pill, gridlines, month labels, and hover tooltips (tooltip still shows the month average, count and recent items).
- Months with no data create a gap in the line rather than a bar.

## Referral icons
- Make the three step icons black and white: neutral light-grey/white circular chips with black doodle strokes, no pastel tints.

## Technical notes
- `src/components/progress/ProgressChart.tsx`: swap the bar markup for an inline SVG path (Catmull-Rom/cubic smoothing over the visible months) plus an area path; hover targets remain invisible per-month columns so tooltips keep working.
- `src/index.css`: retune `--progress-bar` (or add a light/line pair) to the very light blue.
- `src/components/progress/ReferralInvite.tsx`: chips become monochrome.
- No data or query changes.
