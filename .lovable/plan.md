## Goal

Add a "Stripe Metrics" section to `/admin-dashboard` that shows two key numbers, refreshed on demand:

1. **Churn rate** — % of subscriptions canceled in the selected window vs active at the start.
2. **Spend per customer** — average revenue per paying customer (ARPU), plus a top-spenders list.

Refresh-on-load (no webhook sync needed). Both Stripe accounts pulled in parallel: the main account (`STRIPE_SECRET_KEY`) and the lesson-proposal account (`STRIPE_SECRET_KEY_LESSON_PROPOSAL`), with a toggle to switch between them or view combined.

## What gets built

### 1. Edge function: `get-stripe-admin-metrics`
- Auth-gated: verifies caller has `admin` or `owner` role via `has_role()`.
- Accepts `{ account: 'main' | 'proposal' | 'both', window: '7d' | '30d' | '90d' | 'mtd' | 'all' }`.
- For each requested account:
  - Lists subscriptions (`status=all`, paginated) → counts active at window start, canceled in window → **churn %**.
  - Lists charges in window (`created[gte]=...`, paginated, `succeeded` only) → groups by `customer` → computes total revenue, unique paying customers, **ARPU = revenue / customers**, and top 10 by spend.
  - Returns: `{ churnRate, canceledCount, activeAtStart, totalRevenue, payingCustomers, arpu, topCustomers: [{email, name, totalSpent, currency}] }`.
- Currency-aware (sums per currency; UI shows GBP first since that's the primary).
- Caches response in-memory per invocation only (no DB writes — always fresh).

### 2. Frontend: `StripeMetricsCard` component on admin dashboard
- Two big stat cards: **Churn Rate** (with canceled/active sub-numbers) and **Avg Spend per Customer** (with paying customer count).
- Window selector: `7d / 30d / 90d / MTD / All time`.
- Account selector: `Main / Lesson Proposals / Combined`.
- Expandable "Top spenders" list (name, email, total spent).
- Refresh button + last-updated timestamp.
- Loading skeleton while fetching; error state with retry.
- Only rendered for users with admin/owner role (already gated on `/admin-dashboard`).

### 3. Service hook: `useStripeAdminMetrics(account, window)`
- Wraps `supabase.functions.invoke('get-stripe-admin-metrics', ...)` via React Query.
- 5-minute stale time (Stripe's API is rate-limited; avoid hammering it).

## Technical details

**Churn calculation:** `(subs canceled in window) / (subs active at window start) * 100`. Pulled from `subscription.canceled_at` filter and a snapshot count at `window_start`.

**Spend per customer:** Aggregates `charge.amount` (succeeded only, refunds subtracted) grouped by `charge.customer`. Customer name/email fetched in a second batched call (`stripe.customers.retrieve` for the top 10 only — not all, to avoid N+1).

**Pagination:** Stripe caps at 100 per page. Loop with `starting_after` until `has_more=false`. Hard cap at 10 pages (1000 records) per metric per account to stay within edge-function timeout — log a warning if hit.

**No DB schema changes.** Pure read-through to Stripe.

**No new secrets needed** — `STRIPE_SECRET_KEY` and `STRIPE_SECRET_KEY_LESSON_PROPOSAL` already exist.

## Files

- New: `supabase/functions/get-stripe-admin-metrics/index.ts`
- New: `src/components/admin/StripeMetricsCard.tsx`
- New: `src/hooks/useStripeAdminMetrics.ts`
- Edit: `src/pages/AdminDashboard.tsx` — mount the card.

## Out of scope (can add later)

- Webhook-driven real-time updates
- Historical charts / trends over time
- MRR, failed payments, refunds breakdown
- Cohort retention analysis