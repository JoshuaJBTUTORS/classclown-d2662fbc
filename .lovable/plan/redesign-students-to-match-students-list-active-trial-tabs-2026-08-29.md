# Redesign /students to match /students-list + Active/Trial tabs

## Goal
Rework `src/pages/Students.tsx` so the client list uses the same visual language as `/students-list` (big heading + count pill, outlined search, rounded pastel list rows with initials avatars and hover arrows), and add Active / Trial tab pills like the `/tutors` page.

## Changes (visual only — all data fetching, dialogs, permissions, and workflows preserved)

### Tabs (mirroring /tutors)
- Add `activeTab: 'active' | 'trial'` state; reset page to 1 on tab change.
- Trial tab: students with `status === 'trial'`.
- Active tab: all other students (status `active`, `inactive`, or unset) so no student is orphaned.
- Pill buttons identical to `/tutors`: rounded-full, 2px foreground border, active tab = black fill with light text, count badge inside (pastel-lilac when inactive, translucent when active).
- Tabs render only when students exist (same condition as tutors).

### Header
- Replace `StudentsHero` with the `/students-list` header pattern: large extrabold heading ("Clients" / "My Children" for parents), pastel-lilac count pill, and the doodle-search outlined input (the search filter logic already exists — it currently has no visible input, this wires one in).
- Keep the existing "Cleo Onboarding" and "Add New" chip buttons in the header, unchanged in behaviour.

### List
- Replace the `StudentCard` grid with `/students-list`-style rows inside the shared card surface (`rounded-[var(--radius-soft)] bg-card shadow-[var(--shadow-soft-lg)]`):
  - Desktop column headers: Name, Email, Parent (hidden for parent role), Subjects/Year, Status, Actions.
  - Each row: rounded pastel-sand row, hover lifts to pastel-sky, initials avatar cycling the five pastel tones, status chip (trial = pastel-butter, active = pastel-mint, inactive = muted).
  - Actions: keep the per-student dropdown (View Profile, Edit Student, Edit Parent, Delete Client with existing role guards) as a circular icon button at the row end, plus the black circular hover arrow that opens the profile — same handlers as today.
- Keep loading skeletons (restyled to the rounded row look), empty states (doodle icon in pastel-sand panel), and the 50-per-page pagination unchanged.
- `StudentCard` / `StudentsHero` become unused by this page; leave the files in place (no deletion) unless they have no other importers — will verify with a search and remove only if orphaned.

## Out of scope
- No changes to `/students-list`, `/students-list/:id`, any dialog internals, or data fetching.
- No UX/flow changes: same buttons, same handlers, same role visibility.

## Verification
- `tsgo` typecheck; confirm build OK via `/tmp/observability/build-errors.log`.
- Visual check of desktop + mobile widths and tab switching in the preview.
