# Redesign /students (Clients) with the Lesson Plans design language

Redesign the `/students` page (`src/pages/Students.tsx`, the "Clients" page) to match the pastel Lesson Plans / Assessment Center design language: Plus Jakarta Sans headings, soft pastel surfaces, pill-shaped search, rounded tiles. No changes to data, dialogs, pagination logic, or role-based behavior — this is presentation only.

## What changes

1. **Hero header (new `src/components/students/StudentsHero.tsx`)**
   - Large Plus Jakarta Sans heading ("Clients" for admin/owner, "My Children" for parents) in the same hero style as the Lesson Plans page.
   - Pill-shaped search input (rounded-full, soft shadow, icon inside) replacing the small search box in the card header.
   - Stat pills in pastel tones: total students, active, trial (and inactive) — same pastel chip treatment as the Assessment Center hero.
   - Action buttons ("Cleo Onboarding", "Add New" dropdown) moved up into the hero, styled as pill buttons to fit the design.

2. **Student list restyle**
   - Replace the default shadcn Card + Table shell with the soft rounded surface: `rounded-[var(--radius-soft)]`, `shadow-[var(--shadow-soft)]`, pastel-tinted background panel.
   - Table restyled to match: softer row hover, no harsh borders, status badges and subject chips keep pastel-friendly variants (trial = butter/orange tone, active = mint/teal tone, inactive = muted).
   - Each row's name cell keeps the "Has Login / Parent Managed" sublabel, restyled with muted-foreground tokens instead of hardcoded gray.
   - "Showing X of Y" count line kept, styled in the muted hero style.

3. **Empty & loading states**
   - Reuse the Lesson Plans `EmptyState`-style panel (pastel sand surface, circular icon, rounded-full action button) for "no clients" and "no search results".
   - Loading state replaced with the same skeleton style used on the redesigned pages.

4. **Clean-up**
   - Remove hardcoded colors (`text-gray-500`, `bg-orange-50`, etc.) in the touched sections in favor of semantic/pastel tokens.
   - Page title/subtitle replaced by the new hero; PageTitle removed from this page only.

## What stays the same

- All data fetching, role filtering (parent sees only their children), search filtering, and pagination logic.
- All dialogs: Edit Student, View Profile, Delete, Add Family/Parent/Client, Link Student, Bulk Import, Edit Parent.
- The "Cleo Onboarding" and "Add New" dropdown functionality.
- Row actions menu and the `/students-list` pages are untouched.

## Technical notes

- Files: new `src/components/students/StudentsHero.tsx`; edits confined to the render/JSX sections of `src/pages/Students.tsx`.
- Reuses existing tokens: `--radius-soft`, `--shadow-soft`, pastel palette (`pastel-mint`, `pastel-butter`, etc.), `font-heading`.
- No new dependencies, no backend changes.
