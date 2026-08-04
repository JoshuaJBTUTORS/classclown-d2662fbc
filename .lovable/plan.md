# Customer Revenue Expansion Tracking (Stripe)

Track how much revenue each customer generates month by month, so you can see whether existing customers are growing, shrinking, or leaving — across both Stripe accounts (main + proposal).

## What you get

1. **Net Revenue Retention (NRR) trend** — a monthly chart showing, for each month, the revenue from customers who were already paying the previous month, split into:
   - Starting revenue
   - Expansion (they paid more)
   - Contraction (they paid less)
   - Churn (they stopped paying)
   - NRR % (above 100% means your existing base is growing)
2. **Top movers table** — customers ranked by biggest increase or decrease in monthly spend, with previous vs current amounts, filterable by month and account.
3. Both live on a new **Revenue Expansion** page reachable from the admin dashboard, with an account filter (Main / Proposal / Combined) and a month range selector.

## How it works

Stripe's API can't answer "how did each customer's spend change over time" quickly, so we store a monthly snapshot in our own database and keep it fresh.

- A new table records one row per customer, per month, per Stripe account, with that month's total paid revenue (net of refunds) and their email/name for display.
- A one-time backfill pulls the complete invoice/charge history from both Stripe accounts and fills the table from the earliest transaction to today.
- A scheduled nightly job re-syncs the current and previous month so late payments and refunds correct themselves.
- The page reads only from our table, so it loads instantly rather than hitting Stripe on every view.

## Technical details

**Database (migration)**
- `stripe_customer_monthly_revenue`: `id`, `account` ('main' | 'proposal'), `stripe_customer_id`, `customer_email`, `customer_name`, `month` (date, first of month), `amount` (numeric, major units), `currency`, `invoice_count`, `synced_at`. Unique on `(account, stripe_customer_id, month)`.
- Grants: `SELECT` to `authenticated`, `ALL` to `service_role`. RLS enabled; read policy restricted to `has_role(auth.uid(),'admin') OR has_role(auth.uid(),'owner')`. Writes only via service role in the edge function.
- `stripe_revenue_sync_state`: `account`, `backfilled_through` (timestamptz), `last_run_at`, `status`, `error` — lets the backfill resume in chunks instead of timing out.

**Edge functions**
- `sync-stripe-customer-revenue`: admin-JWT-gated (same role check pattern as `get-stripe-admin-metrics`). Accepts `{ account, mode: 'backfill' | 'recent', since?, until? }`. Paginates `stripe.invoices.list` (status `paid`, `created` range), falling back to `charges.list` for one-off payments not tied to an invoice; buckets by `created` month in Europe/London; nets out refunds/credit notes; upserts rows. Processes a bounded time slice per call (e.g. 3 months) and returns a cursor so backfill runs as repeated calls until complete.
- `get-stripe-expansion-metrics`: admin-gated, reads the snapshot table only, returns per-month `{ startingRevenue, expansion, contraction, churn, newRevenue, nrr, grr, customerCount }` plus a top-movers list for a requested month.
- Cron: `pg_cron` + `pg_net` nightly call to `sync-stripe-customer-revenue` with `mode: 'recent'` for both accounts.

**Frontend**
- `src/hooks/useStripeExpansionMetrics.ts` — react-query hook mirroring `useStripeAdminMetrics`.
- `src/pages/RevenueExpansion.tsx` at `/admin/revenue-expansion` — NRR line chart, stacked expansion/contraction/churn bar chart (recharts), month + account filters, top movers table, and a "Sync now" button that runs the backfill loop with progress feedback.
- Link card added to `src/pages/AdminDashboard.tsx` next to the existing Stripe metrics card.

**Definitions used**
- A customer's monthly revenue = sum of paid invoice amounts (minus refunds) in that calendar month.
- Expansion = increase for customers paying in both the current and prior month; contraction = decrease; churn = paid last month, zero this month; new = zero last month, paid this month (excluded from NRR, shown separately).
- NRR = (starting + expansion − contraction − churn) / starting.
- Multi-currency: amounts are grouped by currency; if more than one currency appears, the page shows the dominant currency and flags the rest rather than silently mixing them.
