# Share trial bookings and completed proposals with another Lovable project

A read-only API on this CRM that the other project pulls from, protected by an API key.

## What gets shared

**Trial bookings** (from `trial_bookings`)
- Parent name, child name, email, phone
- Subject name, year group, preferred date/time, lesson time
- Status, booking source, referral code, message
- Created/updated timestamps

**Completed proposals** (from `lesson_proposals`, status = `completed`)
- Recipient name, email, phone
- Subject, lesson type, price per lesson, payment cycle, contract term
- Lesson times (weekly session schedule)
- Deal size, calculated from the proposal:
  - sessions per week = number of entries in lesson times
  - weekly value = price per lesson x sessions per week
  - monthly value = weekly value x 4.33
  - contract value = monthly value x contract length (month-to-month = 1, 3 months = 3, 12 months = 12)
- Completed/agreed/created timestamps

## How the other project fetches it

One new endpoint: `crm-data-feed`.

- `GET /crm-data-feed?type=trial_bookings&since=<ISO timestamp>&limit=100`
- `GET /crm-data-feed?type=proposals&since=<ISO timestamp>&limit=100`
- `GET /crm-data-feed?type=all&since=...` returns both lists in one response

Rules:
- Requires header `x-api-key` matching a secret stored in this project. Requests without it get 401.
- `since` filters on the record's last change (updated/completed time) so the other project can poll incrementally and never miss or duplicate records.
- Results sorted oldest-to-newest with a `next_since` cursor in the response, plus `has_more`.
- Default limit 100, maximum 500.
- CORS enabled so a browser-side call from the other project works.

Because records are returned the moment they exist, a poll right after a booking or a proposal completion returns it immediately — effectively real-time from the consumer's side, with no data lost if their app is down.

## Technical details

- New edge function `supabase/functions/crm-data-feed/index.ts`, running with the service role and doing its own API-key check (no Supabase JWT required from the caller).
- New secret `CRM_FEED_API_KEY` — I will generate it and you share it with the other project.
- Subject names resolved by joining `subjects`; year group resolved by joining `year_groups`.
- Deal size computed in the function, so the other project receives ready-made `weekly_value`, `monthly_value`, `contract_months`, and `contract_value` fields in GBP.
- No database changes and no changes to existing app screens.

## After it is built

I will call the endpoint here to confirm both feeds return real data, then give you the exact URL, key, and a sample response to hand to the other project.
