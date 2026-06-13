## Hide Recurring Lessons Page

### Problem
The Recurring Lessons oversight page is visible in the admin sidebar. Recurring lessons auto-generate via cron, so this page is not needed for normal operations.

### Changes
1. **Remove menu item** from `src/components/navigation/Sidebar.tsx` — delete the "Recurring Lessons" entry (icon: `RefreshCw`, href: `/admin/recurring-lessons`) from the "Analytics & Insights" group.
2. **Keep the route** in `src/App.tsx` so the page remains accessible by direct URL if ever needed.

No other changes required.