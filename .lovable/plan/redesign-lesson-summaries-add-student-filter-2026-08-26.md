# Redesign /lesson-summaries + add student filter

## What changes

1. **New pastel hero** replacing the current blue/purple gradient header with floating icons and three glassy stat cards. The new header is a rounded pastel band (same family as School Progress / Students / Assessment Center): bold heading "Lesson Summaries", short subtitle, a scribble motif, and a compact row of pill-shaped controls.

2. **Filters become pills** inside the hero: search box, subject select, date select, refresh — all rounded, borderless, soft-shadow, matching the design language. Stat chips (total recordings, results shown) become small rounded pills instead of three large cards.

3. **New student filter** — a pill dropdown listing each child, colour-coded with the hashed pastel tone used elsewhere. It only appears when the account has more than one student across their lessons (so single-child parents and students never see it). Admins/owners and tutors also get it, since their lesson list spans many students. Options: "All students" plus one entry per student.

4. **Results area restyled**: cards sit on the app background with consistent spacing, the "Showing X of Y" line uses the standard muted heading style, and the empty state becomes a dashed-outline pastel panel with a themed icon, bold heading and supporting copy (same pattern as the School Progress empty state).

No data-fetching or permissions logic changes — the same lessons are loaded, the student filter is applied client-side on the already-fetched list.

## Technical notes

- Rewrite `src/components/lessonPlans/LessonSummariesHero.tsx` to the pastel design: `rounded-[1.5rem]` pastel band, `ScribbleStroke`, `font-heading` title, pill `SelectTrigger`s (`h-11 rounded-full border-none`), black pill refresh button. New props: `studentFilter`, `onStudentFilterChange`, `students` (id + name list).
- `src/pages/LessonSummaries.tsx`: add `studentFilter` state (default `all`); derive the unique student list from `lessons[].lesson_students[].student`; extend `applyFilters` with a student match; only render the student control when the derived list length > 1. Also restyle the loading skeleton and empty state, and drop the old gradient wrapper.
- Student pill colours come from `getPastelTone()` in `src/components/lessonPlans/pastelPalette.ts`, keyed on the student's full name, matching the School Progress hero.
