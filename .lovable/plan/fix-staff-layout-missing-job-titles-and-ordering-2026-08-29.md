# Fix /staff layout, missing job titles, and ordering

## What I verified

1. **Page not full width** — `Staff.tsx` wraps content in `<div className="flex"><div className="flex-1">…`, missing the `min-w-0 w-full` structure that `/tutors` uses (`flex min-w-0 flex-1 w-full flex-col`), so the content column collapses left.
2. **Missing job titles** — I queried the database: only Joshua Ekundayo has a `job_title` set. Britney Lawrence, Hannah Murray, and Musa Thulebona have `NULL` — the earlier seed migration's name matching missed them (Musa's `last_name` even has a trailing space in the DB: `"Thulebona "`). Confirmed current values:
   - Britney Lawrence (admin) — job_title NULL
   - Hannah Murray (admin) — job_title NULL
   - Musa Thulebona (admin) — job_title NULL
3. **Ordering** — list is currently alphabetical by first name; owners (Joshua, Sarah Williams) sit mid-list.

## Changes

### 1. Migration: set job titles by exact user ID (not name matching)
- Britney Lawrence (`e4a7cc2c-c54b-4dc7-8ccc-0748e3b998a0`) → "Head of Growth"
- Hannah Murray (`061da346-7609-4f91-907b-cd23d46bf717`) → "Customer Success Specialist"
- Musa Thulebona (`901546b9-6742-40a5-9527-c0a6aac86204`) → "Sales Development Representative"
- Also normalize Musa's `last_name` to "Thulebona" (trim trailing space).
- Joshua Ekundayo already has "CEO" — no change needed.

### 2. `src/pages/Staff.tsx` — full-width layout
- Restructure to match the `/tutors` shell: `flex min-w-0 flex-1 w-full flex-col min-h-screen bg-background` with a `flex-1` main area, so the page spans the full width next to the sidebar.

### 3. `src/components/staff/AdminList.tsx` — owners first
- Sort order: owners first, then admins, alphabetical by first name (then last) within each group — this puts Joshua (owner) at the top.

## No changes to
- Role pill badges, avatars, Create Admin dialog, RLS, or any fetching logic beyond sort order.

## Verification
- Typecheck + build.
- Confirm the three job titles appear after the migration runs.
