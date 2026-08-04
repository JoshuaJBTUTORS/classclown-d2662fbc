# Fix Revenue Expansion tiles vs chart mismatch

## What you're seeing

Two separate things are going on.

### 1. The tiles only show the current month, the chart shows all 12

The three tiles at the top (NRR, Expansion, New Revenue) always read the **last month in the series**, which right now is August 2026 — four days old. So they show £0 expansion and £0 new revenue, while the chart quite correctly shows the big April/May/June/July bars behind it. Nothing is wrong with the numbers; the tiles are just describing a month that has barely started, with no label telling you that.

### 2. Every customer is being counted twice

Confirmed in the data: for August 2026 there are 7 real paying customers, but the table holds 14 rows — the exact same Stripe customer IDs and amounts stored once under account `main` and again under account `proposal`. It is identical for May, June and July too. The sync is writing the same Stripe account's charges under both labels, so with "Both accounts" selected every figure on the page (revenue totals, expansion, "14 paying customers") is doubled.

## Changes

**Stop the double counting**
- Work out which Stripe key each account label is actually using in the sync function and correct the mislabelled one, so `main` and `proposal` hold genuinely different data.
- Clear the duplicated rows and re-import history once the labels are right.
- If both labels really do point at the same Stripe account, drop the "Both accounts" doubling by deduplicating on customer ID.

**Make the tiles honest about the month**
- Default the tiles to the last **complete** month rather than the in-progress one, and label them clearly (e.g. "July 2026 — full month").
- Show the current partial month separately, marked as in progress, so a mid-month £0 never reads as a collapse.

## Technical notes

- Tiles read `data.series[data.series.length - 1]` in `src/pages/RevenueExpansion.tsx`; the chart maps the whole series, hence the divergence.
- Duplication lives in `stripe_customer_monthly_revenue` (`account`, `stripe_customer_id`, `month` unique key) written by `sync-stripe-customer-revenue`, which loops both account keys.
- Aggregation in `get-stripe-expansion-metrics` keys customers as `account:customer_id`, which is why the same person counts twice under "Both".
