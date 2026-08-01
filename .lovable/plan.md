## Goal

In the client-facing proposal, the weekly schedule table should show only each session's own price. No weekly total.

## Change

`src/components/proposals/ProposalLayout.tsx`
- Remove the "Total per week" footer row from the weekly schedule table.
- Keep the per-row **Price** column exactly as it is (falls back to the legacy `price_per_lesson` when a row has no price).
- Remove the now-unused weekly total calculation.
- In the pricing/investment section, keep the existing behaviour: show `£X per lesson.` when all sessions share a price, and the "Each session is priced individually (see the weekly schedule above)" note when prices differ — with no weekly total figure.

No backend, database, or proposal builder changes.
