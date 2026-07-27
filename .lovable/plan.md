# Per-student HeyCleo sync trigger

No cron was ever scheduled, so nothing to silence — I just won't add the pg_cron entry. Also remove the bulk "Sync to HeyCleo" button from the students list to keep this feature scoped to per-student testing for now.

## Changes

### 1. `src/pages/StudentDetail.tsx` (the page in the screenshot, `/students-list/:id`)
- Add a **"Sync to HeyCleo"** button in the top header row (next to "Back to students" or aligned with the week navigator).
- Owner/admin only (gate on `userRole` from `useAuth`, same pattern as `StudentsList.tsx`).
- Small dropdown next to it: **Previous week / This week** (defaults to This week since the page already shows this week's data).
- On click: invoke `weekly-homework-sync` with `{ week_start, student_ids: [<this student id>] }` — the edge function already accepts `student_ids` and will only process that one.
- Toast the returned `sent / failed / skipped` counts and any receiver error surface.
- Disable button + spinner while in-flight.

### 2. `src/pages/StudentsList.tsx`
- Remove the bulk sync button, week selector, and `handleSync` — keep the list clean while we test one student at a time. (Search bar and everything else stays.)

### 3. Edge function
- No changes needed — `supabase/functions/weekly-homework-sync/index.ts` already supports `student_ids` filtering and `week_start` override.

### 4. Cron
- Not adding any pg_cron entry. When per-student testing looks right, we schedule it in a follow-up.

## Files touched
- `src/pages/StudentDetail.tsx` (new button + handler)
- `src/pages/StudentsList.tsx` (remove bulk trigger)

No schema changes, no new secrets.
