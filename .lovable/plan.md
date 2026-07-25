## Goal
Add a new "Goals" page for the team showing progress against two monthly targets:
1. **2000 lessons scheduled** for the month
2. **1500 trial lessons booked** for the month

## Changes

### 1. New page `src/pages/Goals.tsx`
- Header with page title "Team Goals" and a month selector (prev/next chevrons, same style as Admin Dashboard) defaulting to the current month.
- Two large goal cards, each showing:
  - Goal title and target (e.g. "2000 lessons scheduled")
  - Current count for the selected month
  - Progress bar (`@/components/ui/progress`) with percentage
  - Remaining count and days left in the month
  - Status pill: On track / Behind / Achieved (based on pace vs. day-of-month)
- Reuses the existing month-filter pattern and Premium Teal design tokens.

### 2. Data fetching
- Reuse `getAdminDashboardData({ year, month })` from `src/services/adminDashboardService.ts` — it already returns `regularLessonsCount` and `trialLessonsBooked` for a given month. No service changes needed.

### 3. Routing & navigation
- Register `/goals` in the main router (wherever `AdminDashboard` is registered) behind the same admin/owner protection as the Admin Dashboard.
- Add a "Goals" link in the sidebar/navigation next to the Admin Dashboard entry so the team can reach it.

## Technical notes
- Targets defined as constants at the top of `Goals.tsx` (`LESSONS_GOAL = 2000`, `TRIAL_GOAL = 1500`) so they can be tuned later.
- "On track" heuristic: expected = `target * (dayOfMonth / totalDaysInMonth)`; behind if `current < 0.9 * expected`, achieved if `current >= target`. For past months, only Achieved / Not achieved.
- No database changes, no new edge functions.

## Out of scope
- Per-tutor goals, historical trend charts, editable targets UI, notifications when goals are hit.
