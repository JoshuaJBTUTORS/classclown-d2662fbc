# Redesign /time-off-requests to the ClassClown design language

Visual-only redesign of the admin time-off requests page to match the ClassClown pastel design language. No functional changes: all queries, filters, conflict-detection flow, approve/deny mutations, dialogs, and role gating stay exactly as they are.

## What changes

### Page shell (`src/pages/TimeOffRequests.tsx`)
- Swap `bg-gray-50` for the app background token; remove `container mx-auto` so the page uses the full width beside the sidebar (matching `/tutors`/`/staff` full-width layout).
- Header: Plus Jakarta Sans extrabold heading with a doodle accent (clock doodle from `DoodleIcons.tsx`), no grey subtitle clutter — keep a short one-line subtext in muted foreground.
- Add a summary row of pastel stat chips: Pending (butter), Approved (mint), Denied (blush) with counts derived from the already-fetched data (purely presentational, same data source).

### Pending requests section
- Replace the plain `Card` + bordered boxes with a pastel butter-tinted surface (`rounded-[1.5rem]`, soft shadow, no harsh borders).
- Each request becomes a white rounded row (`rounded-2xl`, black outline style consistent with `/students-list`/`/tutors` rows): initials avatar, tutor name + email, date range with a calendar doodle icon, reason text, status chip (pastel: pending=butter, approved=mint, denied=blush — replacing the raw green/red/yellow badges), and a "Requested on …" footer line.
- Approve / Deny buttons restyled to the design language: Approve = black pill with white text + check icon; Deny = white pill with black outline + X icon (same handlers, same order, same labels).
- Empty state: pastel surface with doodle icon, friendly copy unchanged in meaning.

### Processed requests section
- Same row treatment on a white/neutral card surface with `rounded-[1.5rem]` and soft shadow; admin-notes block becomes a muted pastel inset (`rounded-xl`).

### Filters (`src/components/timeOff/TimeOffFilters.tsx`)
- Restyle to match other redesigned pages: pill search/select inputs (`rounded-full` or `rounded-xl`, outlined), date pickers as outlined pills, status filter chips (All / Pending / Approved / Denied) in pastel tones, Clear filters as a black pill button. Filter logic and props unchanged.

### Deny dialog
- Restyle with scoped `cc-dialog` pattern already used on `/students` modals: rounded corners, outlined textarea, Cancel = outlined pill, Deny Request = black pill. Same fields, same submit behavior.

### Conflict detection dialog (`src/components/timeOff/ConflictDetectionDialog.tsx`)
- Visual pass only: rounded pastel surfaces, black pill primary actions, outlined secondary. Same conflict list content, buttons, and callbacks.

## What does NOT change
- All data fetching (`tutors`, `time_off_requests` queries), mutation, toast messages, conflict-check service, navigation to `/calendar`, and admin/owner role gate.
- Button order, labels, and workflow (Approve → conflict check → proceed / go to calendar; Deny → notes → submit).

## Technical notes
- Reuse existing tokens and helpers: `pastelPalette.ts` tones, `DoodleIcons.tsx`, the `cc-dialog` scoped styles, and row patterns from `StudentsList.tsx`/`Tutors.tsx`.
- Verify with `tsgo --noEmit` and build; check `/tmp/observability/build-errors.log` after edits.
