# Per-customer revenue expansion tracking

Today the system only stores raw monthly revenue per customer. This adds a proper per-customer view with starting, previous, current, expansion, contraction and cumulative expansion figures, plus a table on the Revenue Expansion page to see it.

## Definitions used

For each customer (deduplicated across both Stripe accounts by customer ID):

- **Starting MRR** — the revenue in the customer's first month with any payment (their join month).
- **Previous-month MRR** — revenue in the month before the reporting month.
- **Current MRR** — revenue in the reporting month.
- **Monthly expansion MRR** — current minus previous, when positive.
- **Monthly contraction MRR** — previous minus current, when positive (a drop to zero counts as full contraction/churn).
- **Cumulative expansion since joining** — current MRR minus starting MRR (positive only shows growth; negative means they are below their starting level).

Revenue is calendar-month Stripe charges net of refunds, which is what the existing sync already stores.

## What gets built

1. A database view that computes all six figures per customer per month from the existing `stripe_customer_monthly_revenue` data, deduplicated by customer so the same person is never counted twice across the two Stripe account labels.
2. The expansion metrics edge function gains a per-customer breakdown for a chosen month, backed by that view.
3. A new "Customer expansion" table on `/admin/revenue-expansion`, under the existing chart:
   - Columns: Customer (name/email), Joined, Starting, Previous, Current, Expansion, Contraction, Cumulative expansion.
   - Sortable by cumulative expansion (default) and by current MRR; searchable by name/email.
   - Uses the same "last complete month" the tiles already use, with the month shown in the header.
   - CSV export of the table.

## Technical notes

- New SQL view `stripe_customer_expansion` in the public schema: dedupe rows by `stripe_customer_id` + `month` (max amount per customer/month rather than summing account labels), then window functions `lag()` for previous month and `first_value()` over the customer's month history for starting MRR.
- Months with no charge for a customer are treated as zero so contraction/churn shows correctly; the view generates a continuous month series per customer from their join month to the latest synced month.
- `get-stripe-expansion-metrics` gets an optional `month` argument and returns a `customers` array from the view; existing series/tile output is unchanged so the current chart keeps working.
- `src/pages/RevenueExpansion.tsx` renders the new table from that array; no change to existing tiles or chart logic.
