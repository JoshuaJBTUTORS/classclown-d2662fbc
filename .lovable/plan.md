# HeyCleo SSO failure for Meghna (megray157@gmail.com)

## What the evidence shows

- Account created today 13:11, email confirmed 13:11, last CRM sign-in 13:12. Role in `user_roles`: `tutor` (single role).
- At 13:34:34 the CRM edge function `generate-heycleo-token` ran successfully for her:
  `Generated HeyCleo token for user: megray157@gmail.com with roles: tutor`
  It returned a valid HMAC token and redirected to `https://app.heycleo.io/auto-login?token=...&email=...`.
- No error on the CRM side. The "unauthenticated" message therefore came from HeyCleo's `/auto-login` handler, which lives in the separate HeyCleo Lovable project and cannot be read or fixed from this codebase.

## Most likely cause

Comparing with a working sign-in (owner account at 13:35 works), the only difference in the payload is the role list. HeyCleo's auto-login almost certainly:

1. rejects/ignores the `tutor` role (it is built around `learning_hub_only`, `student`, `parent`, `admin`), or
2. requires a pre-existing HeyCleo-side profile/tutor record for the email and throws "unauthenticated" when none exists.

Token signing is not the issue — the same secret and format worked minutes later for another user.

## Next step (to be done in the HeyCleo project, not here)

1. Open HeyCleo's `/auto-login` page and its token-verification edge function; log the exact rejection branch for `megray157@gmail.com`.
2. Confirm whether the role allow-list includes `tutor`; add it if tutors are meant to have access.
3. Confirm a HeyCleo profile row exists for the email, and create it on first SSO if absent.

No code changes are needed in this CRM.
