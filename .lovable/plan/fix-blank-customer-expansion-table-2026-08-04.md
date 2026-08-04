# Fix blank Customer expansion table

## What's wrong

The per-customer data exists — the `stripe_customer_expansion` view has 113 rows for July 2026 and 113 for August 2026. The table renders empty because no database role has permission to read that view, so the request from the metrics function is rejected and the page receives an empty customer list. The error is swallowed and logged rather than shown, which is why it looks like "no data" instead of an error.

## The fix

1. Grant read access on the `stripe_customer_expansion` view to the backend service role (and to signed-in admins, matching the underlying revenue table).
2. Surface failures instead of hiding them: if the customer query errors, return the error so the page can show "Couldn't load customer data" rather than a silent empty state.

## Technical notes

- Migration: `GRANT SELECT ON public.stripe_customer_expansion TO service_role;` plus `GRANT SELECT ... TO authenticated;`. The view is defined with `security_invoker=on`, so row access still follows the base table's policies.
- `supabase/functions/get-stripe-expansion-metrics/index.ts`: replace the `console.error` on `custErr` with a `customersError` field in the JSON response.
- `src/pages/RevenueExpansion.tsx`: render that error message in the Customer expansion card when present.

No schema, calculation, or layout changes.
