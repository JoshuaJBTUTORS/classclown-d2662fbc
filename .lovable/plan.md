## Problem

When Step 1 of onboarding returns a non-2xx error, an orphan `auth.users` row can be left behind (e.g. auth user created but `parents` insert failed, or a prior aborted attempt). Retrying then fails with "email already registered" or the FK link issue, because a stale auth user is blocking a clean create.

## Fix

Update `supabase/functions/create-parent-account/index.ts` so that **before** we create anything, we look up any existing auth user with the same email and delete it if it is orphaned. This becomes the first data step after auth/role checks.

### New pre-create cleanup step (runs before the current `parents` email check)

1. Find any existing auth user for `email` via `supabaseAdmin.auth.admin.listUsers` (paged) or a filtered lookup.
2. If found:
   - Check `parents` for a row with that `user_id`.
   - If a linked `parents` row exists → return the existing "A parent account with this email already exists" 400 (don't delete a live account).
   - If no `parents` row exists → it's orphaned. Call `supabaseAdmin.auth.admin.deleteUser(existingUser.id)` and log the cleanup.
3. Proceed with the existing flow (parents email check → find trial students → create auth user → insert parent → link students).

### Notes

- Keep the existing rollback (delete auth user if `parents` insert fails) — this new step handles orphans from prior runs; the rollback handles the current run.
- No frontend changes. `src/pages/Onboarding.tsx` will just stop seeing the "email already exists" / FK errors on retry.

## Verification

- Manually create an orphan (auth user with no `parents` row), then run Step 1 for that email → succeeds, orphan deleted, new parent created, proposal linked.
- Run Step 1 for an email that already has a real `parents` row → still returns 400 with the existing message.
- Run Step 1 for a brand-new email → unchanged behavior.
