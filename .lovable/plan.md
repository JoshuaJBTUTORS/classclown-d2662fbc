# Redesign /students-list to the ClassClown design language

Visual-only redesign of the simple students list page. No changes to data fetching, search behaviour, navigation, or roles.

## What changes

- **Header**: replace the generic PageTitle block with a large Plus Jakarta Sans heading ("Students") and the count shown as a small pastel pill, matching the Cleo Calendar / Progress header style.
- **Search**: rounded-full search field with a black outline and a circular doodle magnifier chip, replacing the plain bordered input.
- **List surface**: swap the shadcn Card for a soft ClassClown surface — 1.5rem radius, soft shadow, no harsh border, generous padding.
- **Rows**: keep the same columns (Name, Email, Phone, Year/Grade, Status) but restyle as roomy rounded rows with a pastel hover tint, a small initials avatar chip next to the name, and a black circular arrow at the row's right edge (reusing the existing calendar/subject-card arrow treatment).
- **Status**: replace shadcn Badge variants with pastel status chips (mint for active, sand/neutral otherwise).
- **Empty / loading / no-match states**: pastel panel with a doodle icon and the existing copy instead of plain grey text.
- **Mobile**: rows collapse into stacked pastel cards so the table doesn't overflow.

## Preserved exactly

- `useStudentData` hook, filtering logic, and the search fields matched (name, email, phone, grade).
- Row click navigates to `/students-list/:id`.
- Sidebar, MobileMenuButton, and page structure.

## Technical notes

- Reuse existing tokens: `--radius-soft`, `--shadow-soft`, `bg-pastel-mint/lilac/sky/sand`, and doodle icons from `src/components/progress/ProgressDoodles.tsx` (no new lucide "LLM-style" icons).
- Only `src/pages/StudentsList.tsx` is edited; a small doodle addition to the existing doodles file only if a needed glyph is missing.
- Verify with a TypeScript check and build after the edit.
