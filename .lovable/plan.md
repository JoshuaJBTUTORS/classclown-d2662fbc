# Refer a Friend (£50 + £50)

A dedicated referral page students land on after every lesson, with a shareable personal booking link and a direct "enter your friend's details" form, plus full tracking of who referred whom.

## What gets built

### 1. Refer a friend page (`/refer`)
- Hero: "Give £50, get £50" — friend gets £50 off, referrer gets £50 when the friend joins.
- Personal share link: `https://classclowncrm.com/book-trial?ref=<CODE>` with copy button, WhatsApp share and email share.
- Direct referral form: friend's parent name, email, phone (country-code normalised via the existing phone util), optional child name/year group and note.
- "My referrals" list: each referral with status (Invited, Trial booked, Joined, Reward paid).

### 2. End-of-lesson landing
- When a student leaves the video room, they are redirected to `/refer` instead of back to the calendar.
- Only students are redirected; tutors and admins keep the current behaviour.
- The page includes a "Back to my lessons" link so it is never a dead end.

### 3. Referral tracking
- Each user gets a unique short referral code, generated on first visit to `/refer`.
- Direct form submissions create a referral row immediately and email the sales team (reusing the existing referral notification function, updated to the £50/£50 wording).
- `/book-trial` and `/book-trial-musa` read `?ref=` from the URL, keep it through the steps, and store it on the trial booking. If a matching pending referral exists (same email or phone) it is linked; otherwise a new referral row is created with status "Trial booked".
- Admin can see referrals and mark rewards paid.

### 4. Existing £100 calendar dialog
Left untouched as requested.

## Technical notes

Database migration:
- `referral_codes` — user_id, code (unique), created_at. Owner can read their own; service_role full access.
- `referrals` — referrer_user_id, referral_code, friend_name, friend_email, friend_phone, child_name, notes, status (`invited` | `trial_booked` | `joined` | `reward_paid`), trial_booking_id, source (`link` | `form`), timestamps. RLS: referrers read their own rows; admins/owners read and update all via `has_role`; inserts by the referrer or service_role.
- `trial_bookings`: add `referral_code text`.
- GRANTs to `authenticated` and `service_role` on both new tables.

Frontend:
- New `src/pages/ReferFriend.tsx` plus small components (`ShareLinkCard`, `ReferralForm`, `ReferralList`) under `src/components/referral/`.
- Route `/refer` added in `src/App.tsx` behind auth.
- `src/hooks/useReferral.ts` — fetch/create code, list referrals, submit a referral.
- Video room exit handler redirects students to `/refer`.
- `TrialBooking.tsx` / `TrialBookingMusa.tsx` capture `?ref=` and pass `referral_code` into `createTrialBooking`, which forwards it to the insert.

Backend:
- Update `send-referral-notification` to the £50/£50 copy and include the referral row id.
- Trial booking insert path stamps the referral code and links/creates the referral row.
