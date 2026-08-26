# Remove the Upload Document button (School Progress)

The hero pill button was already removed. A second "Upload Document" button still exists in the empty state of `src/pages/SchoolProgress.tsx` (lines 256–261), shown when a student/parent has no documents. The user still sees an Upload Document button, so remove this one too so no Upload Document button remains anywhere on `/school-progress`.

## Change
- In `src/pages/SchoolProgress.tsx`, delete the empty-state `{(userRole === 'student' || userRole === 'parent') && currentStudent && (...)}` block (lines 256–261) containing the "Upload Document" `<Button>`.
- Leave the `showUpload` state and the `SchoolProgressUpload` form intact (not in scope — only the button is requested for removal). No other UI changes.

## Verify
- Build passes.
- Navigate to `/school-progress` as a parent with no documents: no Upload Document button is visible.
