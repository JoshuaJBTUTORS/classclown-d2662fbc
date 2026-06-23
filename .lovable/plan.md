## Problem

The offer page URL `/offer/6b035c02.../6169199a-8737-4458-8e8e-fec79da1db7` is missing the final character of the access token. The real token in `tutor_offers.access_token` is `6169199a-8737-4458-8e8e-fec79da1db70`.

Because `access_token` is a `uuid` column, Supabase/Postgres throws `invalid input syntax for type uuid` when the URL token isn't a valid UUID. That raw error is being shown to the recipient.

Root cause of truncation: an email client (or copy/paste) cut the trailing `0`. The DB value itself is correct.

## Fix (frontend only, `src/pages/OfferView.tsx`)

1. Before querying Supabase, validate the `token` route param against a UUID regex.
2. If invalid, short-circuit with a friendly message:
   - "This offer link looks incomplete or invalid. Please open the link directly from your email (avoid copy-pasting) or contact us to resend it."
3. Keep the existing "Offer not found" message for valid-shape tokens that don't match a row.
4. Wrap the existing `supabase.from('tutor_offers').select(...)` in try/catch so any future Postgres error never leaks raw text to the user — show the same friendly message and log the original to the console.

## Out of scope

- No DB changes (token is correct).
- No email template changes (the generated link is correct; truncation is downstream).
- No change to admin notify flow.

## Optional follow-up (not in this change unless you want it)

- Resend this specific offer to `joshua@classbeyondacademy.io` so they get a fresh, working link. Say the word and I'll trigger it.
