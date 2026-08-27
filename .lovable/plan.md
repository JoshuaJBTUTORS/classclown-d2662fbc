# Redesign the Calendar page to the ClassClown design language

Bring `/calendar` in line with the pastel design language already used on Lesson Plans, Assessment Center, Students, School Progress and Lesson Summaries: Plus Jakarta Sans headings, Inter body, soft pastel surfaces, 1.5rem radii, pill-shaped controls, and the ScribbleStroke "tiger stripe" motif.

## What changes visually

1. **Hero header** — replace the plain "Calendar" title row with a `CalendarHero` component styled like the Assessment Center hero (no striped box): big `font-heading` title "Cleo Calendar", short subtitle, and the action buttons rendered as black/pastel pill buttons on the right (Show Filters, Schedule Lesson, Request Topic, Refer Friend — same role rules as today). The legend currently hidden behind an info tooltip becomes a small inline row of pastel legend chips.

2. **View switching** — the Tabs (Calendar View / Teacher View) and the ViewOptions toggles become pill-shaped segmented controls on a soft card surface instead of the default bordered shadcn look.

3. **Calendar surface** — wrap the FullCalendar grid in a rounded (1.5rem) card with the soft shadow token, and add scoped `.calendar-container` CSS in `index.css` so FullCalendar chrome matches: pill nav/today buttons, `font-heading` toolbar title, softened grid lines, muted day headers, rounded lesson events, and pastel "today" highlight. Availability background blocks move from hardcoded green hex values to pastel-mint tokens; time-off blocks to pastel-blush.

4. **Lesson events** — rounded corners, tighter type scale, subject colour mapping kept but routed through pastel tokens so it works in dark mode.

5. **Filters panel** — restyle `CollapsibleFilters` / `CalendarFilters` as a rounded pastel drawer: pill search inputs, pill selected-badges, black pill "Clear All". Filter behaviour is untouched.

6. **Teacher view** — `TeacherCalendarView` / `TutorRow` get the same treatment: rounded row cards, pastel availability / time-off / unavailable states using tokens instead of `bg-green-100` / `bg-red-100`.

7. **Empty and loading states** — dashed pastel panel with a scribble motif instead of plain "Loading..." text.

## Technical notes

- New: `src/components/calendar/CalendarHero.tsx`.
- Edited: `src/pages/Calendar.tsx`, `CalendarDisplay.tsx`, `CollapsibleFilters.tsx`, `CalendarFilters.tsx`, `TeacherCalendarView.tsx`, `TutorRow.tsx`, `ViewOptions.tsx`, `src/utils/calendarColors.ts`, and a scoped FullCalendar block in `src/index.css`.
- Reuse `src/components/lessonPlans/ScribbleStroke.tsx` and `pastelPalette.ts`; no new colour values are invented — existing `--pastel-*` tokens only, so dark mode keeps working.
- Presentation only: no changes to `useCalendarData`, filter logic, lesson dialogs' behaviour, or any data fetching.

## Out of scope

`LessonDetailsDialog` and its sub-panels (already redesigned separately) stay as they are unless you want them included.
