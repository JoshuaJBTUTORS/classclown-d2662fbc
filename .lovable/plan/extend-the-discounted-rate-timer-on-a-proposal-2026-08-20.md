# Extend the discounted-rate timer on a proposal

Today the 24-hour discount countdown on a proposal page is hard-derived from the proposal's creation time (`created_at + 24h`), so once it lapses there is no way to give a family more time without recreating the proposal.

## What changes

Add an explicit deadline on each proposal and a way for admins to push it out.

- New nullable column `discount_deadline` on `lesson_proposals`. When it's empty, the proposal behaves exactly as now (`created_at + 24 hours`), so nothing existing changes.
- On the Proposals dashboard, each row gets an "Extend offer" action (clock icon) next to Edit/Resend. It opens a small dialog showing the current deadline and whether it has already passed, with quick options: +12 hours, +24 hours, +48 hours, or a custom date and time.
- Extending from a deadline that has already expired counts forward from now, so "+24 hours" always means a full 24 hours from the moment you click it.
- After saving, the dashboard refreshes and shows the new deadline; the public proposal page and the pricing panel both count down to it.

## Where the timer is read

- `ProposalLayout` header countdown — uses the new deadline when set.
- `UrgencyPriceDisplay` (the struck-through "24HR SPECIAL" price block) — takes the resolved deadline instead of computing its own from creation time.

## Technical notes

- Migration: `ALTER TABLE public.lesson_proposals ADD COLUMN discount_deadline timestamptz;` (nullable, no backfill). Existing owner/admin policies already cover the write; no new policy or grant needed.
- Small shared helper `resolveDiscountDeadline(proposal)` returning `discount_deadline ?? created_at + 24h`, used by `ProposalLayout.tsx` and `UrgencyPriceDisplay.tsx`.
- `UrgencyPriceDisplay` prop changes from `createdAt` to `deadline` (ISO string); the caller passes the resolved value.
- New `src/components/proposals/ExtendOfferDialog.tsx` writes directly via the Supabase client (`update lesson_proposals set discount_deadline`), guarded by the existing admin/owner RLS policy. No edge-function change; `update-lesson-proposal` is untouched so editing a proposal does not clear the extension.
- `ProposalDashboard.tsx` adds `discount_deadline` to its `Proposal` interface, the new action button, and a re-fetch on success.
