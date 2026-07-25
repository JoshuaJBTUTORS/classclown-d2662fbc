## Goal
Add a month/year filter to the Admin Dashboard so the three metric cards (Trial Lessons Booked, Trial Attendance Rate, Regular Lessons) can be viewed for any past or current month.

## Changes

### 1. `src/services/adminDashboardService.ts`
- Update `getAdminDashboardData` to accept an optional `{ year, month }` argument.
- Use those values to compute `monthStart` / `monthEnd` instead of always using the current month.
- Keep the "only past lessons" clamp for trial attendance rate so future dates in the selected month don't distort the percentage; for a fully past month, all lessons count.

### 2. `src/pages/AdminDashboard.tsx`
- Add state `selectedMonth` (Date, defaults to current month).
- Add a compact month selector in the header row next to the Refresh button:
  - Prev month button (chevron left)
  - Label showing "Month YYYY"
  - Next month button (chevron right), disabled when selected month ≥ current month
- Pass `{ year, month }` into `getAdminDashboardData` and re-fetch whenever `selectedMonth` changes.
- Update the subtitle to reflect the selected month instead of always "current month".

## Out of scope
- No changes to `UserPasswordReset`, `VoiceMinutesManager`, or `StripeMetricsCard` — the filter only drives the three lesson metric cards.
