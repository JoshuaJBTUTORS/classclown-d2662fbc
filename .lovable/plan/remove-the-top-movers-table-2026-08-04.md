# Remove the Top movers table

Take the "Top movers" table off the Revenue Expansion page. The NRR/GRR trend and the expansion vs contraction chart stay exactly as they are.

## Why

With "Both accounts" selected, the same person shows up twice because the two Stripe accounts issue separate customer IDs for them. Rather than show a misleading list, the table comes off the page for now. The underlying data stays in place, so a person-level version can be rebuilt later.

## What changes

- The Top movers card, its month picker, and the customer rows are removed from `/admin/revenue-expansion`.
- Nothing else on the page moves: account filter, time range, summary tiles, NRR trend line, and the expansion/contraction bar chart all stay.
- The import/refresh buttons and nightly sync are untouched.

## Technical details

- `src/pages/RevenueExpansion.tsx`: delete the Top movers `Card` block and the now-unused `moverMonth` state, `statusBadge` helper, and Table/Badge imports.
- `src/hooks/useStripeExpansionMetrics.ts`: stop passing `month` in the request body; leave the `movers` type in place so the backend response still parses.
- `supabase/functions/get-stripe-expansion-metrics/index.ts`: left unchanged, so the movers data is still computed server-side and available when a person-level table is built later.
