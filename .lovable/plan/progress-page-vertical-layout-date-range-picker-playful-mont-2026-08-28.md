# Progress page: vertical layout, date range picker, playful month view

## 1. Vertical layout

- Switch `/progress` from wide side-by-side blocks to a single narrower centred column (max ~880px) so everything stacks: hero → filters → summary → homework by month → assessments.
- Summary stops being a 3-across row: the average becomes a compact black header strip inside the hero, and the two stat tiles sit as a stacked pair (full width on mobile, two-up only on large screens).
- Panels get more vertical breathing room and consistent spacing instead of dense horizontal rows.

## 2. Filter becomes a date range picker

- Replace the 6/12/all-time buttons and year stepper with a single shadcn date range picker (Popover + two-month Calendar, `pointer-events-auto`), showing "1 Jan 2026 – 31 Aug 2026" style text.
- Keep quick presets inside the popover footer (Last 3 / 6 / 12 months, All time) so it stays fast.
- Student filter (owners) and Clear stay next to it.

## 3. Fun, interactive "Homework by month"

Keep the month-by-month idea, make it play:

- Each month is a tall card row with the month name, a big score, and a chunky rounded bar that animates its fill on mount and when the range changes.
- Score-driven personality: a small doodle face/badge per month (great / steady / needs work), plus a "best month" card in solid black with a star scribble.
- Hover lifts the card slightly and reveals a mini strip of dots — one per homework piece, coloured by score — that show a tooltip with title and score.
- Click expands the month with a smooth height/fade transition into the list of pieces, each row animating in with a small stagger.
- A streak line at the top: "3 months improving" with the delta chips, and a confetti-ish scribble accent when the latest month beats the previous.
- All motion via Framer Motion (already used in the project) with reduced-motion respected.

## Technical notes

- Files: `src/pages/Progress.tsx` (column width + stacking), `src/components/progress/ProgressFilters.tsx` (date range picker), `src/components/progress/ProgressChart.tsx` (animated month cards), `src/components/progress/ProgressSummary.tsx` (vertical stack), `src/components/progress/ProgressDoodles.tsx` (new score-face doodles).
- Filter output shape stays `{ dateRange, selectedStudents }` — no changes to `useHeyCleoProgress`, RLS, or role gating.
- Colours from existing tokens only; black accents via `foreground`/`background`.
