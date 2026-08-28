# Progress page: drop attendance, rework "Homework over time"

The design image didn't come through with your message, so this proposes a concrete direction in the ClassClown pastel language. Re-attach the reference and I'll match it instead.

## 1. Remove attendance everywhere on /progress

- Delete the attendance panel from the page layout and remove `AttendanceChart.tsx`.
- Remove the attendance stat tile and its data/copy from `ProgressSummary.tsx`.
- Update the page subtitle so it no longer mentions attendance.
- Homework chart becomes full width; assessment panel stays below.

## 2. New "Homework over time" design

Same data (HeyCleo homework percentages, same filters), new presentation:

- Full-width pastel report-card panel with a soft header row: title, short description, and a small legend chip showing the average score for the visible range.
- Chart switches from a single dotted area line to a layered look:
  - soft gradient area for the score trend,
  - rounded score markers only on the visible data points,
  - a dashed pastel "target" baseline at the student's average so highs/lows read instantly,
  - light horizontal guide bands (0-40 / 40-70 / 70-100) tinted with pastel tones instead of gridlines.
- Compact summary strip under the chart: latest score, best score, number of pieces marked - as small pastel pills.
- Friendly hand-drawn empty state kept for the no-data case.

## Technical notes

- Files: `src/pages/Progress.tsx`, `src/components/progress/ProgressChart.tsx`, `src/components/progress/ProgressSummary.tsx`; delete `src/components/progress/AttendanceChart.tsx`.
- Presentation only - no changes to `useHeyCleoProgress`, filter semantics, RLS, or role gating.
- All colours via existing pastel design tokens; Recharts stays the charting library.
