# Referrals tracking page

Right now there is nowhere in the CRM to see referrals. The `referrals` table exists and is written to by the public refer-a-friend form and the trial-booking link, but it currently holds **0 rows**, and no admin screen reads it. Referral codes live in `referral_codes` (both real accounts and guest referrers).

## What gets built

A new admin page at `/referrals` ("Referrals") under **Business Development** in the sidebar, visible to admin and owner.

### Top summary cards
- Total referrals
- Trials booked from referrals
- Joined (converted)
- Rewards paid / outstanding

### Main table
One row per referral, with:
- Referrer (name, email/phone, and whether they are an existing account or a guest)
- Referral code used
- Friend's name, email/phone, child's name
- Status badge: Invited → Trial booked → Joined → Reward paid
- Source (personal link vs public form)
- Date created, and link through to the linked trial booking when one exists

Controls: search by any name/email/phone/code, filter by status and by source, sort by date, and a CSV export.

### Status editing
Admins can move a referral's status forward from the table (e.g. mark as Joined or Reward paid) so the £50/£50 payouts can be tracked. Each change stamps `updated_at`.

### Leaderboard tab
A second tab grouping by referrer: number of referrals, how many booked a trial, how many joined, and total reward owed. This is the "who is actually sending us families" view.

## Making sure referrals actually get tracked

Two gaps to close so the page has data:
1. **Trial bookings page cross-link** — `/trial-bookings` already stores `referral_code`; add a "Referred" badge and a link to the matching referral row so the two views agree.
2. **Attribution check** — verify `link-trial-referral` runs on every trial booking that carries a `?ref=` code, and backfill any trial bookings that have a `referral_code` but no matching `referrals` row, so historic referrals appear.

## Technical notes

- New page `src/pages/Referrals.tsx` plus small components (`ReferralStatsCards`, `ReferralsTable`, `ReferrerLeaderboard`) under `src/components/referrals/`.
- New hook `src/hooks/useReferralsAdmin.ts` reading `referrals` joined to `referral_codes` and `trial_bookings`.
- Route added in `src/App.tsx` inside the authenticated admin section; nav entry added to `src/components/navigation/Sidebar.tsx` with `roles: ['admin','owner']`.
- Database: a migration adding an admin read/update RLS policy on `referrals` (using `has_role(auth.uid(),'admin'|'owner')`) plus the matching grants, since current policies do not expose the table to admins. No schema changes beyond that.
