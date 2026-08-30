# Suggested pay period quick-select in /earnings date filter

The pay-period rule already exists in `src/utils/earningsPeriodUtils.ts` as `getMonthlyEarningsPeriod(date)`: start = day after the last Friday of the previous month, end = last Friday of the current month, paid on the 1st of the following month (e.g. Sat 27 Jul → Fri 28 Aug, paid 1 Sep). No new date logic is needed.

## Changes

### src/components/earnings/EarningsDateFilter.tsx
- Add a "Suggested pay period" row at the top of the filter card with two pill buttons:
  - **Current pay period** — sets the range via `getMonthlyEarningsPeriod(new Date())`.
  - **Previous pay period** — sets the range via `getMonthlyEarningsPeriod` for the previous month (using the 15th of the previous month, matching `getPreviousEarningsPeriod`'s approach).
- Each button label shows its computed range underneath in small text (e.g. "Jul 27 – Aug 28"), so the user sees the suggestion before clicking.
- Clicking one calls the existing `onDateRangeChange({ from, to })` — everything downstream (data load, payment period display) works unchanged.
- Buttons styled as outlined rounded-full pills in the ClassClown style; the active suggestion is highlighted when the current selection matches it.

## Notes
- No changes to data fetching, goal logic, or `earningsPeriodUtils` — the existing period function is reused.
- Manual From/To pickers and Clear Filter remain exactly as they are.
