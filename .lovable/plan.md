# Redesign the Calendar filters panel to the ClassClown design language

Visual-only redesign of the calendar filter drawer (the panel shown in the screenshot: "Calendar filters" with Students / Tutors / Parents / Subjects search dropdowns and Lesson Type select). No changes to filter logic, data fetching, selection handlers, or state.

## What changes visually

1. **Drawer shell (`CollapsibleFilters.tsx`)** — the fixed desktop panel and mobile Sheet get the soft ClassClown surface: rounded card feel, `--shadow-soft`, hairline divider instead of the harsh border, `font-heading` title with a small doodle-style close chip (pastel circle + X) matching the reference.

2. **Section header (`CalendarFilters.tsx`)** — "Filter calendar" row becomes a pastel chip group: funnel doodle icon in a pastel circle, `font-heading` label, and the "N active" count as a pastel pill. "Clear All" becomes a black pill button (same pattern as the calendar Request Topic button).

3. **Group labels** — Students / Tutors / Parents / Subjects / Lesson Type labels get uppercase micro-label styling with small doodle-flavoured icons in pastel circles, consistent with the other redesigned pages.

4. **Trigger buttons** — the four "Search ..." popover triggers and the Lesson Type select become soft pastel-outlined pill inputs (1.5rem/full radius, soft border token, hover lift), matching the screenshot's pill shape but using semantic pastel tokens.

5. **Popover content** — rounded (1rem) pastel dropdown surfaces with soft shadow; search input row and items styled with rounded hover states; selected check becomes a filled pastel dot/tick.

6. **Selected badges** — the selected student/tutor/parent/subject chips become pastel pills with an X remove affordance, one pastel tone per group (students, tutors, parents, subjects) for quick scanning.

## Technical notes

- Edited: `src/components/calendar/CalendarFilters.tsx`, `src/components/calendar/CollapsibleFilters.tsx` only.
- Reuse existing `--pastel-*` tokens and `--radius-soft`; no new colours invented, dark mode keeps working.
- Zero behaviour change: same popovers, search state, toggle handlers, clear buttons, lesson-type options, and `onClearFilters`.
