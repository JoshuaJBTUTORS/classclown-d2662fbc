# Homework by month: rounded pill bars

Replace the squiggle line chart on `/progress` with a bar layout in the style of the reference image.

## What it will look like
- Each visible month is a tall, fully rounded (pill-shaped) bar whose height is that month's average homework score.
- Bars sit on a soft light track so months with no data still show a faint empty pill.
- Default bar colour is a soft neutral grey; the best-performing month in the window is highlighted in the accent colour (like the orange bar in the reference).
- The month label sits at the bottom of each bar, rotated vertically, matching the reference.
- No percentage text printed inside the bar. The score appears only in a tooltip on hover, showing the month, average percentage and number of homeworks.
- Keep the existing panel header, the left/right month arrows and the visible-range label.

## Technical notes
- Edit `src/components/progress/ProgressChart.tsx` only.
- Drop the SVG squiggle path, area fill, point markers, gridlines and average baseline; keep the month bucketing, filters, offset window (6 months) and loading/empty states unchanged.
- Bars rendered as flex columns with `motion.div` height animation (respecting `useReducedMotion`), wrapped in the existing `Tooltip` primitives for hover detail.
- Colours use existing design tokens (neutral pill token plus the accent token already used for highlights); no hardcoded hex.
