# Fix wrong profile name for Nikta Gooya

## What I found

The tutor record is correct, but the linked login account is not:

- `tutors` row: **Nikta Gooya**, nikta.gooya@gmail.com, active — correct.
- Auth user for nikta.gooya@gmail.com (`c9e39255-…`) has profile **"Hassan " / "ZI"**, role `tutor`, created today 12:10 UTC.
- A second tutor account, hassanziara23@icloud.com (`3255e60a-…`), also **Hassan ZI**, was created 7 minutes later at 12:17 UTC.

So Nikta's account was created first while the create-tutor form still held Hassan's name in the first/last name fields — only the email was changed. Hassan's own account was then created properly. Anywhere the UI reads the profile (sidebar, greetings, staff/tutor detail) Nikta shows as "Hassan ZI".

Note the stored first name is `"Hassan "` with a trailing space.

## Fix

Data-only correction for account `c9e39255-…` (nikta.gooya@gmail.com):

1. `profiles`: set `first_name = 'Nikta'`, `last_name = 'Gooya'`.
2. `auth.users.raw_user_meta_data`: merge with the `||` operator so only `first_name` / `last_name` change and all other keys (role, email_verified, sub) are preserved.

Hassan's account (`3255e60a-…`) is left untouched.

## Not changing

No code changes — the tutor list, tutor record, roles and subjects are already correct. This is a bad-data fix only.

## Verification

Re-query both profiles and their auth metadata to confirm Nikta Gooya / Hassan ZI are separate and correct.
