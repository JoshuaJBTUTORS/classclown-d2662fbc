# Lesson Plans: soft pastel UI refresh

Restyle the Lesson Plans page and its subject detail view in the style of the reference: soft pastel cards, generous rounding, big friendly headings, clean whitespace. Functionality, data and layout structure stay exactly as they are — this is a visual pass only, scoped to Lesson Plans.

## What changes visually

- **Hero**: replace the busy gradient wash and floating icons with a calm header — large heading, one-line subtitle, a single rounded pill search field with soft inner shadow.
- **Stat cards**: three flat pastel tiles (mint, lilac, butter) with rounded 24px corners, no borders, subtle lift on hover.
- **Current week banner**: simplified card — week number as the dominant element, term and date range as quiet pills, slimmer rounded progress bar.
- **Subject cards**: the main change. Each subject gets a pastel tint (rotating palette by subject), a large rounded card, subject name in bold display type, meta line underneath, and a circular arrow button in the corner like the reference.
- **Subject detail dialog**: matching rounded surface, pastel section headers, week rows as soft rounded list items instead of dense table-style rows.
- **Empty / loading states**: same rounded pastel language so nothing looks out of place.

Both mobile and desktop are handled deliberately: single-column stacked cards with comfortable tap targets on phone, two/three-column grid with the same proportions on desktop.

## Technical notes

- Add pastel surface tokens (mint, lilac, butter, blush, sky) plus a soft card shadow and radius scale to `src/index.css` and expose them in `tailwind.config.ts`. All new colours are HSL semantic tokens — no hardcoded hex or `bg-white` in components.
- Files touched: `LessonPlansHero.tsx`, `CurrentWeekBanner.tsx`, `SubjectCard.tsx`, `SubjectDetailDialog.tsx`, `EmptyState.tsx`, `LoadingSkeleton.tsx`, plus `src/pages/LessonPlans.tsx` for spacing/grid only.
- Existing hardcoded `hsl(var(--deep-purple-blue))` style utilities in these files get replaced with the new tokens; dark mode variants defined for each token.
- No changes to data fetching, the rebuild-from-document dialog logic, or any other page.
