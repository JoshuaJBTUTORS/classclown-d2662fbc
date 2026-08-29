# Sort /students and /students-list alphabetically

## Goal
Display students in alphabetical order on both `/students` and `/students-list`, consistent with the `/tutors` page (which sorts by first name).

## Current state (verified)
- `/students-list` (`src/pages/StudentsList.tsx`) pulls from `useStudentData()` (`src/hooks/useStudentData.ts`), which orders by `last_name` ascending. No client-side sort.
- `/students` (`src/pages/Students.tsx`) fetches from Supabase ordered by `last_name` ascending (line 143). The trial/active tabs and search filter do not re-sort.
- `/tutors` already sorts by first name — this makes alphabetical by **first name** the consistent choice across people pages.

## Changes

### 1. `src/hooks/useStudentData.ts`
- Change the query `.order('last_name', ...)` → `.order('first_name', { ascending: true })`.
- Add a secondary `.order('last_name', { ascending: true })` for tie-break stability.

### 2. `src/pages/Students.tsx`
- Change the fetch query `.order('last_name', { ascending: true })` → `.order('first_name', { ascending: true })` with a secondary `.order('last_name', { ascending: true })`.
- Add a client-side re-sort on `tabStudents` (and thus `filteredStudents` / `currentStudents`) by `first_name` then `last_name` so the order stays alphabetical regardless of how the data is reshaped after the parent join.

### 3. `src/pages/StudentsList.tsx`
- Add a client-side sort on `filteredStudents` by `first_name` then `last_name` (case-insensitive) so the rendered list is alphabetical, matching `/students`.

## Non-goals
- No UX, layout, or functionality changes — only ordering.
- No changes to filters, tabs, pagination, dialogs, or permissions.

## Verification
- Typecheck passes.
- Both pages render rows A→Z by first name; trial/active tabs and search preserve the order.
