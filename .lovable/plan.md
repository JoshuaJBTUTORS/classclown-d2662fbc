# Sort Pending and Reviewed assessment assignments newest first

## Goal
On `/assessment-assignments`, change the **Pending Review** and **Reviewed** tabs so the newest items appear first.

## Current state
- The page loads all assignments via `assessmentAssignmentService.getAllAssignments()`, which orders by `created_at DESC`.
- Tabs then filter that same list client-side, so every tab is currently sorted by when the assignment was **created**, not when it was submitted or reviewed.

## Changes

1. **Pending Review tab**
   - Sort the filtered `submitted` assignments by `submitted_at` descending (most recently submitted first).

2. **Reviewed tab**
   - Sort the filtered `reviewed` assignments by `reviewed_at` descending (most recently marked/reviewed first).

3. **All Assignments / In Progress tabs**
   - Remain sorted by `created_at` descending.

## Files to update
- `src/pages/admin/AssessmentAssignments.tsx`
  - Update the `submitted` and `reviewed` `TabsContent` blocks to sort the filtered array before rendering.
  - Add small helper or inline sort using `new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()` (and equivalent for `reviewed_at`).

## Out of scope
- No schema changes.
- No service method changes required; sorting will happen client-side on the already-fetched list.
