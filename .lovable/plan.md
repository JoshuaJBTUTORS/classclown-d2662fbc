# Fix: sending a lesson proposal fails silently

## What the logs show

Every attempt today hit `create-lesson-proposal` and was rejected before anything was saved:

```text
Authorization header: Present
Auth check result: { userError: "Auth session missing!", hasUser: false }
Error in create-lesson-proposal: Unauthorized: Auth session missing!
```

Nothing was written — the newest row in `lesson_proposals` is from 26 Aug, which is why the proposal never appears on the All Proposals page and no email goes out.

The header reaches the function but the token inside it does not resolve to a user, so the function throws. The exact reason (expired/blank token vs. anon key being forwarded) is not yet confirmed — step 1 below confirms it before the rest is trusted as the whole story.

## Plan

1. Add one temporary log line in the function recording the token length and its `role` claim (never the token itself), send one proposal, and read the log. That tells us definitively whether the browser sent a real user token, an anon key, or an empty bearer.
2. Harden the function's auth to match `update-lesson-proposal`, which does the same job and is working:
   - use a service-role client and validate the bearer token explicitly with `auth.getUser(jwt)`;
   - return a proper `401` JSON instead of throwing a generic 400;
   - replace the `user_roles ... .single()` role lookup with a list check (`.some(owner|admin)`), so an account with more than one role no longer errors.
3. Harden the caller in `ProposalBuilder` / `EditProposal`: before invoking, get the current session; if it is missing or expired, refresh it, and if that fails show "Your session expired — please sign in again" rather than a silent failure. Surface the function's error text in the toast so a future failure is visible immediately.
4. Re-send a real proposal and confirm a new row appears in `lesson_proposals`, the All Proposals page lists it, and the email/WhatsApp step logs success.

## Technical notes

- Files: `supabase/functions/create-lesson-proposal/index.ts`, `src/pages/ProposalBuilder.tsx`, `src/pages/admin/EditProposal.tsx`.
- `verify_jwt = true` stays on for the function; the in-function check becomes the authoritative one.
- No database or schema changes.
- The temporary diagnostic log from step 1 is removed once step 2 is verified.
