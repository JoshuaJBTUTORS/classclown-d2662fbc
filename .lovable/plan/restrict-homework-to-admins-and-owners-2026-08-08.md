# Restrict /homework to admins and owners

Homework is currently reachable by any signed-in user (the route has no role guard) and the sidebar link shows for admin, owner and tutor.

## Changes

1. **Route guard** (`src/App.tsx`): wrap the `homework` route in `ProtectedRoute` with `allowedRoles={['admin', 'owner']}`, matching how `lesson-plans` is protected. Non-admins hitting `/homework` directly get redirected to `/unauthorized`.
2. **Sidebar link** (`src/components/navigation/Sidebar.tsx`): change the Homework item's `roles` from `['admin', 'owner', 'tutor']` to `['admin', 'owner']` so tutors no longer see it.

No changes to the Homework page internals or homework data logic.
