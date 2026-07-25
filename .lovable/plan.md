## Goal
Reframe the Goals page as a single fixed deadline (end of December 2026) instead of a per-month filter.

## Targets
- **1500 trial lessons booked** — collective bookings between today and 31 Dec 2026 (uses `trial_bookings.created_at` in that range).
- **2000 lessons scheduled in December 2026** — regular lessons with `start_time` in Dec 2026.

## Changes

### `src/pages/Goals.tsx`
- Remove the month selector and month-based state entirely.
- Header shows a countdown: "X days left until 31 Dec 2026".
- Fetch data directly via two Supabase queries (bypass `getAdminDashboardData`, which is single-month scoped):
  - Trial goal: `trial_bookings` count where `created_at` between `GOAL_START` (constant, e.g. 2026-07-25) and 2026-12-31 23:59:59.
  - Lessons goal: `lessons` count where `lesson_type != 'trial'` and `start_time` between 2026-12-01 and 2026-12-31 23:59:59.
- Two goal cards:
  - "Trial Lessons Booked" — subtitle "Collective bookings by 31 Dec 2026"; progress toward 1500.
  - "Lessons Scheduled in December 2026" — subtitle "Regular lessons with a Dec 2026 start time"; progress toward 2000.
- Status pill logic based on the shared deadline:
  - Achieved when current ≥ target.
  - Otherwise expected = target × (elapsed / total) where `elapsed = today − GOAL_START` and `total = 31 Dec 2026 − GOAL_START`; behind if current < 0.9 × expected, else on track.
  - After the deadline: achieved or not achieved.

### Not changed
- `src/services/adminDashboardService.ts`, routing, sidebar entry — all untouched.

## Out of scope
- Editable targets, historical charts, per-tutor breakdown.
