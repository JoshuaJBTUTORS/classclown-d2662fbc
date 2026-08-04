# Guest share links on the public Refer a Friend page

Right now, logged-out visitors on `/refer` only get a form to submit a friend's details. They should also be able to get their own personal book-a-trial link, exactly like signed-in users do.

## The flow

1. A logged-out visitor lands on `/refer` and sees a short "Get your link" step: their name and email.
2. On submit, they immediately get their own personal link (e.g. `https://classclowncrm.com/book-trial?ref=SARA4K2P`) with Copy, WhatsApp and Email share buttons — the same share card signed-in users see.
3. Below the link, the existing "send us your friend's details" form stays available, pre-filled with the name/email they just entered.
4. If their email matches an existing account, they get that account's existing code, so all referrals stay tied to one person and appear in their list when they log in.
5. If they have no account, a guest code is created and stored against their email. If they later sign up or log in with that email, the same code is reused instead of creating a second one.
6. Anyone booking a trial through a guest link still sees "Sarah has invited you to book a trial..." and the booking is attributed back to that guest referrer.

## Technical detail

Database (migration):
- `referral_codes.user_id` becomes nullable; add `guest_name text` and `guest_email text`.
- Unique index on `lower(guest_email)` where `user_id is null`, keeping the existing per-user uniqueness.
- Constraint: a row must have either `user_id` or `guest_email`.
- No new anon grants; all guest code access goes through service-role edge functions.

New edge function `get-referral-link` (public, no JWT):
- Input: `name`, `email` (validated, zod-style checks in line with the other referral functions).
- Looks up a profile/auth user by email; if found, reuses or creates that user's code (same logic as `submit-public-referral`).
- Otherwise reuses or creates a guest code keyed on the email, storing `guest_name`.
- Returns `{ code, shareUrl }`.

Updates to existing functions:
- `resolve-referral-code`: fall back to `guest_name` when `user_id` is null, so the personalised trial-booking heading still works.
- `link-trial-referral`: handle codes with a null `user_id` by matching/creating referral rows on `referral_code` plus `referrer_email` instead of `referrer_user_id`.
- `submit-public-referral`: when a guest code already exists for that email, attach it to the referral row.

Frontend:
- `useReferral`: add a `requestPublicLink(name, email)` action that calls the new function and exposes the returned `shareUrl` for logged-out users (persisted in `localStorage` so a refresh keeps the link).
- `ReferFriend.tsx`: in the logged-out branch, show the new "Get your link" card first; once a link exists, render the existing `ShareLinkCard` plus the public `ReferralForm` with the referrer fields pre-filled.
- `ShareLinkCard` is reused unchanged.
