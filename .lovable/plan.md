# Earnings pay-period suggestion

## Goal
Make `/earnings` automatically use the payroll period rule confirmed for the September 2026 payment: **Saturday 1 August 2026 → Friday 28 August 2026**.

## Changes
1. **Default the earnings date range to the suggested payroll period**
   - Replace the current rolling 30-day default.
   - On page load, set the range to the Saturday immediately after the previous pay period's final Friday through the final Friday of the current period.
   - For 30 August 2026, this resolves to **1 Aug – 28 Aug**, with payment due on **1 Sep**.

2. **Simplify the suggestion display**
   - Replace the separate “Current Pay Period” and “Previous Pay Period” buttons with one clear suggestion:
     - `Suggested Pay Period: 1 Aug – 28 Aug`
   - Make the suggestion clickable so the tutor can reapply it after changing dates.

3. **Keep manual control unchanged**
   - Tutors can still manually change either the start or end date.
   - Clearing the filter, refreshing earnings, goal tracking, payment-date display, and all existing calculations remain unchanged.

## Technical details
- Reuse `getMonthlyEarningsPeriod` from `src/utils/earningsPeriodUtils.ts` so the displayed suggestion and applied range share one rule.
- Update `src/pages/Earnings.tsx` to initialise `dateRange` from that utility instead of `subDays(new Date(), 30)`.
- Update `src/components/earnings/EarningsDateFilter.tsx` to render the single suggested-period control and keep the existing date pickers.
- No backend, database, earnings-service, or permissions changes.

## Validation
- Run typecheck/build checks.
- Verify the August 2026 view suggests and defaults to `1 Aug – 28 Aug`.
- Verify manual start/end date changes still work after the suggestion is applied.