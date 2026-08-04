# Expansion tile: average expansion per active customer

## What changes

The Expansion tile currently shows the month-over-month expansion total (£1,094 for Jul 26). It will instead show the **average lifetime expansion per active customer**, computed from the same per-customer data that powers the Customer expansion table below it.

Definition used:
- Active customer = paying in the selected month (current MRR above zero).
- Per customer expansion = current MRR minus starting MRR (their first month's revenue).
- Tile value = total of those expansions divided by the number of active customers.

For July 2026 this reads: 50 active customers, £1,247.64 total lifetime expansion, so the tile shows about **£24.95** average expansion per customer, with supporting text like "Average per active customer · 50 customers · £1,248 total".

## Technical notes

- `supabase/functions/get-stripe-expansion-metrics/index.ts`: from the `stripe_customer_expansion` rows already fetched for the requested month, filter `current_mrr > 0` and return `avgExpansionPerCustomer`, `totalCumulativeExpansion`, and `activeCustomerCount` in the response.
- `src/hooks/useStripeExpansionMetrics.ts`: add those fields to the response type.
- `src/pages/RevenueExpansion.tsx`: the Expansion tile renders the average with the supporting line; a tooltip/subtext notes that it compares each customer's first month with the selected month.

Charts, NRR, New Revenue and the customer table are unchanged.
