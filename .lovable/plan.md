# Finish the duplicate-revenue cleanup

The Expansion tile currently reads £2,189 for July 2026. The real figure is £1,094.27 across 8 customers — exactly half. Every Stripe customer is stored twice, once under the `main` label and once under `proposal`, with identical customer IDs and amounts, so the page doubles everything.

The code side is already done: the sync now skips a second account label when it points at the same Stripe key, and the metrics function counts each Stripe customer once. What remains is the data.

## Remaining step

- Delete the duplicated snapshot rows stored under the `proposal` label. Every one of them was verified to be an exact copy of a `main` row, so nothing real is lost.
- Clear the matching sync bookkeeping row for that label so the nightly job does not recreate them.

After this the tiles, trend line and bar chart should all halve to the true values, and July expansion will read £1,094.27.

## Technical notes

- `DELETE FROM public.stripe_customer_monthly_revenue WHERE account = 'proposal'` plus the same for `stripe_revenue_sync_state`.
- Verified beforehand: zero `proposal` rows lack an identical `main` counterpart.
- The account selector will then only have meaningful data under "Main"; worth simplifying it to a single option in a follow-up if the two Stripe accounts really have been merged.
