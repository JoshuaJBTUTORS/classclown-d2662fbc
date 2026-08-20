# Assessment marking route

## Current state

The marking page is registered at `/assessment-assignments` (inside the main app layout, admin/owner only) and linked from the sidebar. There is no `/admin/assessment-assignments` route, so that URL falls through and shows nothing.

## Proposed change (optional)

Add a redirect so the `/admin/...` form also works, avoiding dead links in older notes and bookmarks.

## Technical details

- In `src/App.tsx`, inside the main layout route block, add:
  `<Route path="admin/assessment-assignments" element={<Navigate to="/assessment-assignments" replace />} />`
- No other files change.

If you'd rather just use the correct URL, skip this plan and go to `/assessment-assignments`.
