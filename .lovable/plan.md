# Fix School Progress access for multi-child parents (Manju Mathai)

## Root cause (confirmed)

Manju's account is healthy: role `parent` (is_primary = true), parent record linked, and **5 children** attached (Amelia, Daniel, Michelle — plus two duplicate records 829/830 with no last name).

The bug is in `src/pages/SchoolProgress.tsx`:

- A parent's child is only auto-selected when they have **exactly one** student (`if (studentsData.length === 1) setCurrentStudent(...)`).
- With 2+ children, `currentStudent` stays `null`, and the access guard (`if (!userRole || (!currentStudent && userRole !== 'admin' ...))`) kicks the parent out with "You don't have access to school progress features."
- The page has **no student picker**, so multi-child parents can never get in — single-child parents work fine.

## Fix

1. **Allow parents with children through the guard** — change the no-access condition so a parent with `allStudents.length > 0` is never blocked; only parents with zero students see the "No students found" message.
2. **Add a student selector for multi-child parents** — a row of pill chips (or a Select) at the top listing each child's name; tapping one sets `currentStudent`. Auto-select the first child so the page loads with content immediately.
3. The rest of the page (upload button, filters, document grid) already works off `currentStudent`, so it flows through unchanged. RLS on `school_progress` already scopes parents to their own children — no database changes needed.

## Optional data cleanup (flag to user)

Manju has duplicate student records: `Amelia` (id 829) and `Daniel` (id 830) with null last names, alongside the real records 360/361. These will show as duplicate chips in the selector. Recommend deactivating/merging them — can do this on request.

## Files touched

- `src/pages/SchoolProgress.tsx` — access guard + student selector UI (design-language pastel chips to match the rest of the CRM refresh).
