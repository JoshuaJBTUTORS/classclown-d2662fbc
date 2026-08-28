# Progress page: month-by-month homework, no graph

## 1. Filters

- Remove the subject filter entirely from `/progress`.
- Replace the free date-range picker with a simple month filter: a "Last 6 months / Last 12 months / All time" range control, plus prev/next year stepping so months can be walked back and forth.
- Keep the student filter (owners only) and the Clear action.

## 2. Replace the chart with a month-by-month breakdown

No chart library, no line/area graph. Instead a stacked list of month rows:

- One row per month in the selected range, newest first, months with no homework shown as a quiet "nothing marked" row.
- Each row shows: the month name and year, a large average score, the number of pieces marked, and a horizontal progress bar filled to that month's average.
- A small delta chip on each row (e.g. +6 vs previous month) so improvement reads without a graph.
- Expanding a month reveals its individual homework pieces (title, date, score) as compact lines.
- Top of the panel: overall average across the visible months and the best month, as pill stats.

## 3. More black in the styling

Lean harder into the design language's black elements:

- Panel header bar and month-row score bars in near-black (`foreground`) with pastel accents used sparingly.
- The "best month" row and the stats pills get solid black backgrounds with light text.
- Hero and summary tiles gain black borders/underlines rather than only pastel fills.

## Technical notes

- Files: `src/components/progress/ProgressChart.tsx` (rewritten as `HomeworkByMonth`), `src/components/progress/ProgressFilters.tsx`, `src/pages/Progress.tsx`, `src/components/progress/ProgressSummary.tsx` (drop `selectedSubjects` from the filter type/usages).
- Data source unchanged: `useHeyCleoProgress`; monthly buckets computed client-side from `submitted_at`/`due_date`.
- Recharts no longer used on this panel; all colours via existing tokens.
