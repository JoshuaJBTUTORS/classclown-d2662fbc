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

No — the "Refer Friend £100" button on the calendar does **not** store anything. That dialog (`src/components/calendar/ReferFriendDialog.tsx`) only calls the `send-referral-notification` edge function to email the team; it never writes a row to `referrals`. That is the main reason the table is currently empty.

Three gaps to close so the page has data:
1. **Calendar refer dialog writes a referral** — on submit, insert a `referrals` row with the logged-in user as `referrer_user_id` (plus their name/email), the friend's details, `source: 'calendar_dialog'`, `status: 'invited'`, and their personal `referral_code`, then send the email as it does today. If the email fails the referral is still saved.
2. **Trial bookings page cross-link** — `/trial-bookings` already stores `referral_code`; add a "Referred" badge and a link to the matching referral row so the two views agree.
3. **Attribution check** — verify `link-trial-referral` runs on every trial booking that carries a `?ref=` code, and backfill any trial bookings that have a `referral_code` but no matching `referrals` row, so historic referrals appear.

## Backfilling past referrals from the sent emails

Every past referral only exists as an email. The Supabase edge logs cannot help — they currently hold just 9 rows covering about eight minutes, so historic `send-referral-notification` calls are long gone. The one durable record is Resend, which holds every email the function sent with the subject line `New referral from <name> (Refer a Friend, £50)` (older ones used the previous subject wording) from `noreply@classbeyondacademy.io`.

Backfill approach:
1. A one-off admin-only edge function `backfill-referrals-from-resend` lists sent emails from the Resend API using the existing `RESEND_API_KEY`, paging back through the full history.
2. It keeps only referral notification emails (matched on sender plus subject pattern) and parses the referrer name/email, friend name/email/phone, child name, notes and referral code out of the email body, using the email's send date as `created_at`.
3. It runs in **preview mode first** — returns the parsed list so the results can be checked before anything is written.
4. On confirmation it inserts the rows into `referrals` with `source: 'backfill_email'` and `status: 'invited'`, matching the referrer to an account by email where one exists, and skipping any referral already present (same friend email/phone and referrer).
5. The Referrals page then shows the full history, and statuses can be moved forward manually from there.

If Resend's history does not reach far enough back, the remainder can be imported from a CSV export of the notification inbox using the same parser.


## Technical notes

- New page `src/pages/Referrals.tsx` plus small components (`ReferralStatsCards`, `ReferralsTable`, `ReferrerLeaderboard`) under `src/components/referrals/`.
- New hook `src/hooks/useReferralsAdmin.ts` reading `referrals` joined to `referral_codes` and `trial_bookings`.
- Route added in `src/App.tsx` inside the authenticated admin section; nav entry added to `src/components/navigation/Sidebar.tsx` with `roles: ['admin','owner']`.
- Database: a migration adding an admin read/update RLS policy on `referrals` (using `has_role(auth.uid(),'admin'|'owner')`) plus the matching grants, since current policies do not expose the table to admins. No schema changes beyond that.
