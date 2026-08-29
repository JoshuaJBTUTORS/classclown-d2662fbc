# Redesign /homework in the ClassClown design language

Visual-only refresh of the Homework page so it matches the pastel, doodle-led design language already used on Calendar, Progress, Lesson Plans and Settings. No functionality, data fetching, permissions, dialogs, buttons or labels change.

## What changes

**Page shell (`src/pages/Homework.tsx`)**
- Replace the generic `PageTitle` with a large, plain heading ("Homework") in the same style as Cleo Calendar / Your Progress: big Plus Jakarta Sans title, no blue pill.
- Full-width, generous padding, soft page background — no boxed container.
- Error / access alerts restyled as rounded black-outlined notices instead of default destructive alerts.
- Parent "Select Child" dropdown becomes a rounded pastel select chip matching the calendar/progress filters.

**Admin/tutor view (`HomeworkManager.tsx`)**
- Search field and filter select restyled as rounded pastel controls with a hand-drawn icon; "Assign Homework" becomes the solid black rounded button used elsewhere.
- Tabs ("Assigned Homework" / "Submissions") restyled as pill tabs with black active state.
- Homework and submission cards become rounded (1.5rem) surfaces with a black outline, pastel fill, doodle icon in the corner, rounded badges, and the black circular arrow affordance in the bottom-right used on calendar/lesson-plan tiles.
- Card colour is assigned consistently per state (assigned / graded / ungraded) using existing design tokens.
- Empty and loading states get doodle illustrations and rounded framing.

**Student/parent view (`StudentHomeworkView.tsx`)**
- Same rounded, outlined, pastel card treatment; "Refresh Assignments" becomes an outlined black-border rounded button.
- Overdue / submitted / graded states use pastel peach / sky / mint tokens plus rounded status badges instead of raw red/green Tailwind colours.
- The info alert becomes a soft rounded note.

**Icons**
- Reuse existing doodles from `LessonDoodles.tsx` / `ProgressDoodles.tsx`; add any missing hand-drawn glyphs (book, paperclip, calendar, tick) to the doodle set rather than using generic lucide icons on the main surfaces.

## Out of scope
- `AssignHomeworkDialog`, `ViewHomeworkDialog`, `HomeworkCompletionCheckDialog` internals (can be a follow-up if you want the dialogs restyled too).
- Any query, RLS, role-gating or submission logic.

## Technical notes
- Colours come from existing CSS variables in `src/index.css`; no hardcoded hex/`bg-white`-style utilities in components.
- Card markup keeps the same click handlers and conditional branches; only class names and wrapper elements change.
