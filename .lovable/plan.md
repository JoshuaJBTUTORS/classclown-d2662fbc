# Avg expansion per customer: exclude that month's new joiners

## Why

For July 2026 the tile shows £25. The maths behind it:

| Group | Customers | Total expansion |
|---|---|---|
| Expanded | 13 | +£1,893.69 |
| Contracted | 6 | −£646.05 |
| Flat (older, no change) | 23 | £0 |
| Joined in July | 8 | £0 by definition |
| **Total** | **50** | **£1,247.64** |

£1,247.64 ÷ 50 = £24.95.

The 8 customers who joined in July can't have expanded yet — their starting MRR is their current MRR — so they only drag the average down.

## What changes

The tile's population becomes "customers active in the selected month who joined before that month". For July 2026 that's 42 customers and £1,247.64, giving **£29.71**.

- Tile value: £29.71 (was £24.95)
- Supporting line updates to reflect the smaller population, e.g. "42 established customers · £1,248 total growth since they joined (as of Jul 26)"
- New joiners are still counted in the New Revenue tile and the charts — this only affects the expansion average.

## Technical details

- `supabase/functions/get-stripe-expansion-metrics/index.ts`: when computing `avgExpansionPerCustomer`, `totalCumulativeExpansion` and `activeCustomerCount`, filter the `stripe_customer_expansion` rows to `current_mrr > 0 AND joined_month < month` (currently only `current_mrr > 0`).
- `src/pages/RevenueExpansion.tsx`: reword the supporting line under the tile to say "established customers" and note in the tooltip that customers who joined in the selected month are excluded.
- The customer expansion table below is unchanged — it still lists everyone, including new joiners.
