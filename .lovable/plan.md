# Time Off Requests — modal redesign, full-width fix, remove summary chips

## What we'll change

### 1. Full-width fix (`src/pages/TimeOffRequests.tsx`)
The page renders inside `MainLayout`'s flex container, but its root `<div className="min-h-screen bg-background">` has no width/flex classes, so it shrinks to its content width and leaves white space on the right — the same root cause we fixed on `/staff` and `/tutors`.
- Add `min-w-0 w-full flex-1` to the root wrapper (and to the Access Denied branch) so the page fills the space beside the sidebar.

### 2. Remove the top summary chips
- Delete the "X Pending / X Approved / X Denied" chip row under the header, and the now-unused `pendingCount` / `approvedCount` / `deniedCount` variables (and any unused doodle components).
- The per-section "Pending Requests" count pill and status chips on each request card stay untouched.

### 3. Redesign the Approve and Deny modals to the ClassClown design language
Both modals already exist; this is a visual-only restyle — no changes to logic, conflict detection, buttons, or workflows.

**Approve flow — `src/components/timeOff/ConflictDetectionDialog.tsx` (all 3 states):**
- "No Conflicts Found" state: replace the plain look with a pastel-mint hero circle using a hand-drawn doodle check, rounded `[var(--radius-soft)]` surface, bold heading, muted body copy, and pill buttons — Cancel (black outline) and Continue with Approval (solid black).
- "Scheduling Conflicts Detected" state: keep conflict data identical; wrap each conflict in a pastel card with doodle calendar/clock/people/tag icons and pastel student/subject chips (mostly already applied — refine spacing, icon circles, and button styling to match).
- Loading state: styled spinner panel consistent with the other two states.

**Deny modal — the action `Dialog` in `TimeOffRequests.tsx`:**
- Pastel-blush summary panel with the tutor name, dates and reason, styled Label/Textarea (rounded, black outline via existing `.cc-dialog` scoped styles), and pill buttons — Cancel (outline) and Deny Request (solid black).

## What stays the same
- All approve/deny logic, conflict checking (`checkTimeOffConflicts`), mutations, admin notes, filtering (including date-overlap), role gating, navigation to calendar, and every button's behavior.

## Verification
- TypeScript check + build log must pass.
- Confirm dialogs open and page spans full width (note: authenticated screenshot checks aren't possible — Supabase auth is externally managed).
