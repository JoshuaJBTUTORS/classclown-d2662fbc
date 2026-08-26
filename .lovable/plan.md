# Fix School Progress access for multi-child parents (Manju Mathai)

## Root cause (confirmed)

Manju's account is healthy: role `parent` (is_primary = true), parent record linked, and **5 children** attached (Amelia, Daniel, Michelle — plus two duplicate records 829/830 with no last name).

The bug is in `src/pages/SchoolProgress.tsx`:

- A parent's child is only auto-selected when they have **exactly one** student (`if (studentsData.length === 1) setCurrentStudent(...)`).
- With 2+ children, `currentStudent` stays `null`, and the access guard (`if (!userRole || (!currentStudent && userRole !== 'admin' ...))`) kicks the parent out with "You don't have access to school progress features."
- The page has **no way to choose a student**, so multi-child parents can never get in — single-child parents work fine.

## Fix

1. **Allow parents with children through the guard** — a parent with `allStudents.length > 0` is never blocked; only parents with zero students see the "No students found" message. Auto-select the first child so the page loads with content immediately.
2. **Student picker for multi-child parents** — when a parent (or admin/owner) has more than one student, render a student selector directly under the page title, styled per the design language:
   - Pill-shaped trigger (`rounded-full`), borderless muted surface, soft shadow on hover
   - Plus Jakarta Sans bold label showing the selected child's name
   - Each dropdown item tinted with the child's hashed pastel tone (`getPastelTone`)
   - Changing the selection sets `currentStudent` and refetches that child's documents
3. The upload button, filters, and document grid already key off `currentStudent`, so they flow through unchanged. RLS on `school_progress` already scopes parents to their own children — no database changes needed.

## Optional data cleanup (flag to user)

Manju has duplicate student records: `Amelia` (id 829) and `Daniel` (id 830) with null last names, alongside the real records 360/361. These would show as duplicate entries in the picker. Recommend deactivating/merging them — can do this on request.

## Files touched

- `src/pages/SchoolProgress.tsx` — access guard + student picker.
