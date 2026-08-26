# Lesson Summaries: stripes, full width, pagination

## What changes

1. **Tiger stripes on summary cards** — each pastel summary card gets the same brush-sweep motif (`ScribbleStroke`) used on the lesson plan tiles, sitting in the top-right corner at low opacity, replacing the current faint book icon watermark. Stripe colour inherits the card's pastel tone so it stays subtle.

2. **Full page width** — the summaries list currently renders as a single-column grid, so each card stretches but the page still feels empty on wide screens. The list becomes a responsive grid: 1 column on mobile, 2 columns from large screens, 3 from extra-large, with the hero and list sharing the same edge-to-edge padding so nothing is cut off on the right.

3. **Show 5, then paginate** — only the 5 most recent recordings render on load. Below the list, a numbered pager (Previous, page numbers, Next) lets the user step through the rest. Changing any filter or search resets back to page 1. The pager hides when there are 5 or fewer results.

## Technical notes

- `src/components/learningHub/LessonSummaryCard.tsx`: import `ScribbleStroke` from `@/components/lessonPlans/ScribbleStroke`, render it absolutely positioned top-right (`opacity` via `text-current/10`), drop the `BookOpen` watermark.
- `src/pages/LessonSummaries.tsx`:
  - grid classes become `grid gap-6 lg:grid-cols-2 xl:grid-cols-3`.
  - add `page` state, `PAGE_SIZE = 5`, derive `pagedLessons` by slicing `filteredLessons`; reset `page` to 1 inside the existing filter effect.
  - render the shadcn `Pagination` component (`@/components/ui/pagination`) styled with the pastel language: rounded-full items, active page filled `bg-foreground text-background`.
  - sorting stays newest-first (existing query order) so the first page is the 5 most recent.
