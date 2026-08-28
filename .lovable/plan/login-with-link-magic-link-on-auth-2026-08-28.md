# Login with link (magic link) on /auth

Replace the "Forgot Password?" link on the sign-in page with **Login with link**. The user enters their email, we email them a one-time sign-in button from `enquiries@classbeyondacademy.io`, and clicking it signs them straight into `classclowncrm.com` — never a lovable.app URL.

## What changes for the user

1. On `/auth`, the "Forgot Password?" link is replaced with **Login with link**.
2. Clicking it opens a small email-entry panel (same styling as the current page) instead of the old reset form.
3. They submit their email, see a "Check your inbox" confirmation.
4. The email arrives from `enquiries@classbeyondacademy.io` with a branded **Log in to Class Beyond** button.
5. Clicking the button lands them signed in at `https://classclowncrm.com`.
6. If the email is not registered, we still show the success state (standard security practice) but send nothing.

## Technical detail

**New edge function `send-login-link`** (public, `verify_jwt = false`):
- Validates the posted email with Zod.
- Uses the service-role client and `supabase.auth.admin.generateLink({ type: 'magiclink', email, options: { redirectTo: 'https://classclowncrm.com/' } })` to mint a real Supabase tokenised link.
- Rewrites/forces the link host so the callback always resolves to `https://classclowncrm.com` — no `*.lovable.app` fallback.
- Sends via Resend (`RESEND_API_KEY` already configured) from `Class Beyond <enquiries@classbeyondacademy.io>`, using a React Email template in `_shared`/local `_templates` styled to the Class Clown pastel design (Plus Jakarta Sans, rounded button, hand-drawn feel).
- Returns a generic success payload whether or not the user exists; logs the real outcome server-side.
- Links expire per Supabase default (1 hour); one-time use.

**Supabase config:**
- `https://classclowncrm.com` and `https://classclowncrm.com/**` must be present in the auth redirect allow-list, and Site URL set to `https://classclowncrm.com`, otherwise Supabase rejects the `redirectTo`. I will apply this with the auth config tool.

**Frontend (`src/pages/Auth.tsx`):**
- Remove the `Forgot Password?` button and the `ForgotPasswordForm` import/branch.
- Add a `LoginLinkForm` component (`src/components/auth/LoginLinkForm.tsx`) rendered inline in the left column: email input, "Send login link" button, sent-state confirmation, "Back to sign in".
- `ResetPasswordForm` and the `?tab=reset-password` route stay untouched so existing reset emails in the wild still work.

**Files touched:** `src/pages/Auth.tsx`, new `src/components/auth/LoginLinkForm.tsx`, new `supabase/functions/send-login-link/index.ts` + email template, `supabase/config.toml`.

## Notes

- The old `send-password-reset-email` function is left in place (unused from the login page) rather than deleted, so admin-triggered resets keep working.
- Emails send from the existing Resend setup on `classbeyondacademy.io`, not Lovable's managed email.
