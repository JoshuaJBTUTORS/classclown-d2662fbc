# Progress page: wider layout, graph view, referral card

## 1. Back to a horizontal layout
- `src/pages/Progress.tsx`: drop the narrow `max-w-[880px]` column and go full width again (`w-full max-w-none`), with the summary tiles sitting side by side as before.
- `src/components/progress/ProgressSummary.tsx`: remove the "Homework set" and "Overall trend" tiles entirely. Only the big homework-average ring card stays, laid out horizontally.

## 2. Date filter restyled to the design language
- `src/components/progress/ProgressFilters.tsx`: keep the range picker behaviour but restyle it to match the pastel/ClassClown language used elsewhere on the page — pill trigger with a hand-drawn calendar doodle instead of the Lucide icon, rounded-[1.5rem] popover with a soft border and pastel header, preset chips as pastel pills, and the same pill treatment for the owner student select and Clear button.

## 3. Homework by month becomes a graph with month arrows
- `src/components/progress/ProgressChart.tsx`: replace the expandable month-card list with a clean chart panel.
  - Header shows the current window (e.g. "Mar – Aug 2026") with left/right arrow buttons to page the window backwards and forwards through the months that have data.
  - The chart itself is a bar/line style graph of the monthly homework average (rounded pastel bars with the value above each bar, a dashed average baseline, light gridlines, month labels underneath).
  - Hovering a month shows a tooltip with the average, number of pieces marked and the top titles.
  - Remove all happy/steady/low face doodles, the mood copy and the streak badge.
  - Empty state stays for ranges with no scored homework.
- `src/components/progress/ProgressDoodles.tsx`: remove the now-unused face doodles.

## 4. Assessments box becomes a referral opportunity
- Remove `AssessmentProgressChart` from `/progress` and add a new `src/components/progress/ReferralInvite.tsx` in its place.
- The card uses the existing "Give £50, get £50" offer: short headline, the three steps (share link, friend tries a free lesson, you both get £50), a "Refer a friend" button linking to `/refer`, and a copy-link action using the existing `useReferral` hook's share URL.
- Styled as a pastel panel with a doodle accent so it fits the rest of the page.

## Technical notes
- Filter shape stays `{ dateRange, selectedStudents }`; homework data keeps coming from `useHeyCleoProgress`, so RLS and role gating are unchanged.
- `AssessmentProgressChart.tsx` stays in the codebase, just no longer rendered on `/progress`.
- Month paging is client-side over the already-filtered scores; the date range filter still bounds the data.
