## Goal
When sending an offer letter from a tutor row, pre-fill the form with that tutor's actual hourly rate and a default start date. Both fields remain fully editable by the admin.

## Current Issue
`SendOfferDialog` hardcodes `hourlyRate` to £11.20 and leaves `startDate` blank, even when opened from an existing tutor profile.

## Changes

### 1. `src/components/tutors/SendOfferDialog.tsx`
- Accept new optional props: `defaultHourlyRate?: number`, `defaultStartDate?: string`
- Use `defaultHourlyRate` to initialise `hourlyRate` state (fallback to empty string if not provided)
- Use `defaultStartDate` to initialise `startDate` state (fallback to empty string)

### 2. `src/pages/Tutors.tsx`
- Pass `defaultHourlyRate` from the selected tutor (`tutor.hourly_rate ?? tutor.normal_hourly_rate`)
- Pass `defaultStartDate` as today + 7 days formatted as `YYYY-MM-DD`

### 3. `src/types/tutor.ts` (verify)
- Confirm `hourly_rate` and `normal_hourly_rate` are already defined on the `Tutor` interface.

No database or edge function changes are needed — the form already submits these values correctly.