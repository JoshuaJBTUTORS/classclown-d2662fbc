# Redesign "Add New Lesson" modal to ClassClown design language

Visual-only restyle of the Add New Lesson / Review Room dialog on the calendar page. No fields, buttons, validation, or workflows are added, removed, or reordered.

## What changes (visual only)

**File: `src/components/lessons/AddLessonForm.tsx`**

- **Dialog shell** — rounded `var(--radius-soft)` corners, soft shadow, no harsh border, responsive padding (`p-4 sm:p-6`), viewport-safe width for mobile.
- **Header** — title in `font-heading` extrabold (Plus Jakarta Sans), muted description.
- **Review Room / Recurring / Group Session switch cards** — pastel surface chips (mint/sky) with soft borders, rounded corners, small doodle-style icon accents; switches keep existing handlers.
- **Inputs & selects** (Title, Subject, Description, Tutor, times) — taller pill-rounded controls (`rounded-full` or large radius), soft outlined borders, consistent focus ring using existing tokens.
- **Date picker buttons** — same pill treatment; calendar popover gets rounded soft card styling.
- **Recurring sub-section** — indented panel restyled with pastel left accent instead of hard `border-gray-200`.
- **Availability Check row** — outlined pill button with icon; `AvailabilityStatus` container lightly softened (pastel info/success/warning tones) without changing its logic or props.
- **Footer buttons** — Cancel as outlined pill, Create as solid black pill (`bg-foreground text-background`), consistent with other redesigned dialogs (`.cc-dialog` pattern already used on /students modals where applicable).
- **Loading state** — softer spinner treatment, same text.

**Child components touched lightly (styles only):**
- `src/components/lessons/MultiSelectStudents.tsx` — pill trigger + chip styling to match (trigger, selected-student chips, dropdown surface).
- `src/components/lessons/AvailabilityStatus.tsx` — pastel tone classes for status cards.

## What does NOT change

- Form schema, zod validation, all conditional rendering (Review Room hides fields, group/recurring logic).
- All handlers, Supabase inserts, LessonSpace room creation, recurring instance generation, availability check logic, toast messages.
- Field order and labels stay identical.

## Verification

- `bunx tsc --noEmit -p tsconfig.app.json` and build log check.
- Visual check of the dialog on desktop and mobile viewport.
