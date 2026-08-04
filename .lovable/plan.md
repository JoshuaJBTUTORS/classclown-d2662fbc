# Public Refer a Friend page

Make `https://classclowncrm.com/refer` work for people who are not logged in (e.g. a parent who just finished a trial lesson and lands there), while keeping the full logged-in experience unchanged.

## Behaviour

The `/refer` route moves out from behind the login wall and decides what to render:

- **Logged in** — exactly what exists today: hero, personal share link, referral form, "My referrals" list.
- **Logged out** — same hero and "how it works" steps and gift illustration, but:
  - No personal share link card and no "My referrals" list (there is no account to attach them to).
  - A single referral form that first asks for **your details** (your name, your email, your phone) and then **your friend's details** (friend's name, email and/or phone, optional child name, optional note).
  - On submit: thank-you confirmation, plus a "Log in to get your own share link and track your referrals" prompt linking to `/auth`.
  - "Back to my lessons" is replaced with a link to the main site / login for logged-out visitors.

## Attribution

When a logged-out referral is submitted, the backend tries to match the referrer's email or phone to an existing user. If it matches, the referral is attached to that user (and their existing referral code is used, or one is generated) so it shows up in their "My referrals" list next time they log in. If there is no match, the referral is stored unattached with the referrer's contact details so the sales team can still credit the £50.

Either way the sales team gets the same notification email as today.

## Technical notes

- `src/App.tsx`: move `refer` out of the protected `MainLayout` block into a public top-level route (`/refer`). Keep a `PublicPageLayout`-free simple render since `ReferFriend` already owns its own page chrome.
- `src/pages/ReferFriend.tsx`: read `user` from `useAuth`, branch on it for the share card / referral list / back-link, and render the public form variant when signed out.
- `src/components/referral/ReferralForm.tsx`: add an optional `mode="public"` that shows the extra referrer name/email/phone fields (name + at least one contact required) and passes them to the submit handler.
- `src/hooks/useReferral.ts`: guard all authenticated queries behind `user` (already partly done), and add `submitPublicReferral` that calls a new edge function instead of inserting directly (RLS blocks anon inserts).
- New edge function `submit-public-referral` (verify_jwt = false, added to `supabase/config.toml`): validates input, looks up a matching user by email/phone, resolves or creates their `referral_codes` row when matched, inserts the `referrals` row with `source = 'public_form'` and `status = 'invited'` using the service role, then invokes `send-referral-notification`.
- Migration: allow `referrals.referrer_user_id` to be null (for unmatched public submissions) and add nullable `referrer_name`, `referrer_email`, `referrer_phone` columns.
- Basic abuse protection in the edge function: required fields, email/phone format checks, and a duplicate guard on the same friend email/phone within 24 hours.
