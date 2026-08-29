# Tutors page: full-width fix + View Profile modal redesign

## 1. Full-width fix on /tutors
The page markup has no explicit max-width, yet rows stop short of the right edge. Steps:

1. Verify at runtime with Playwright which element is constraining width (the pastel row grid vs. the white card vs. `main`), measuring bounding boxes on the live preview.
2. Likely fix: the row grid columns `minmax(0,1.4fr) minmax(0,1.8fr) auto auto` leave `auto` columns narrow and can collapse — change to `minmax(0,1.4fr) minmax(0,1.8fr) minmax(0,1fr) auto` (or explicit `w-full` on the list container) so rows and the card span the full available width beside the sidebar.
3. Confirm visually that the list extends to the right padding edge, matching other redesigned pages (e.g. /students-list).

## 2. View Tutor Profile modal (`src/components/tutors/ViewTutorProfile.tsx`)
Redesign to the ClassClown design language and simplify content:

- **Remove** the star rating block (and the now-unused `generateStars` helper).
- **Remove** the entire "Academic Information" section (specialities + education).
- Keep: Title, Status, Contact Information (full name, email, phone), Biography (if present), Joined Date.
- Format Joined Date as a friendly date (e.g. `22 Jan 2026`) instead of the raw ISO timestamp.
- Visual language: pastel rounded section panels (`bg-pastel-sand/50`, `rounded-2xl`), section headings with doodle accents, pastel status chip (mint for active, butter for pending, sand otherwise), initials avatar at the top next to the tutor's name. Keeps existing `.cc-dialog` shell.

No changes to data fetching, handlers, or which fields are edited elsewhere — display only.

## Verification
- `tsgo` typecheck + build.
- Playwright screenshot of /tutors (list full width) and the View modal open, confirming no rating/academic sections.
