
## Goal
Fix the two issues that caused the recent error:
1. The onboarding "Create parent account" action was pressed twice, so the second run fought against the first run's freshly-created rows.
2. `create-parent-account` currently deletes rows from the `parents` table and unlinks `lesson_proposals` during cleanup — we want it to only ever touch the auth user and let the database's cascade do the rest.

## Changes

### 1. `src/pages/Onboarding.tsx` — prevent double-submission
- Guard `handleCreateFromProposal` so it becomes a no-op if `creating` is already true or if step 1 is already marked `completed`.
- Disable the "Create parent account" button when either condition is true (currently only disabled while `creating`), and keep the spinner state visible.
- Same guard on `handleAddedLessons` (step 3) so accidental double-clicks don't push two HubSpot tickets / two welcome emails.

### 2. `supabase/functions/create-parent-account/index.ts` — auth-only cleanup
Replace the current STEP 0 block (lines ~138–264) with a much smaller version:
- Look up any existing auth user(s) for the email (paginated `listUsers`, same as today).
- For each match, call `supabaseAdmin.auth.admin.deleteUser(id)` directly.
- Do NOT delete from `parents`, do NOT ilike-match `parents.email`, do NOT null out `lesson_proposals.parent_id`.
- Rely on the existing `ON DELETE CASCADE` FKs on `profiles`, `user_roles`, `parents.user_id`, etc. to clean themselves up when the auth user is removed.
- Keep the "parent already exists" safety-net check that returns a friendly 400 (it will only trigger if cascade didn't clear a stale row, which shouldn't happen).

### Technical notes
- The FK `parents.user_id -> auth.users(id)` is already `ON DELETE CASCADE`, which is why deleting the auth user is sufficient.
- The double-submit guard uses the existing `creating` state plus `completed.includes(1)` — no new state needed.
- No database migration required.
