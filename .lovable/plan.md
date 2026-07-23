## New behaviour — no deletes, just link

Rewrite `supabase/functions/create-parent-account/index.ts` so onboarding never deletes anything. It reuses whatever already exists and links it together.

### Flow (Step 1 of onboarding)

1. **Look up existing Auth user by email** (`auth.admin.listUsers` paginated match).
2. **If found**: reuse that Auth user.
   - Call `auth.admin.updateUserById(existingId, { password: 'classbeyond123!', email_confirm: true, user_metadata: { first_name, last_name, role: 'parent' } })` so the emailed credentials always work.
   - Do NOT delete the Auth user. Do NOT touch profiles, user_roles, parents, or students.
3. **If not found**: `auth.admin.createUser` with the same password as today.
4. **Parents row**:
   - If a `parents` row already exists for that email → `UPDATE parents SET user_id = <authId>, first_name, last_name, phone, billing_address, emergency_contact_name, emergency_contact_phone WHERE id = <existing.id>` and reuse its `id`.
   - Otherwise `INSERT` a new parents row as today. Use the resulting `parents.id` as `parentId`.
5. **Link students by matching email** (this is the requested "link the account to the student account with matching emails"):
   - `UPDATE students SET parent_id = <parentId> WHERE lower(email) = lower(<email>) AND (parent_id IS NULL OR parent_id <> <parentId>)`.
   - Also cover the case where the student row is already parented to a stale parents row for the same email: additionally `UPDATE students SET parent_id = <parentId> WHERE parent_id IN (SELECT id FROM parents WHERE lower(email) = lower(<email>) AND id <> <parentId>)`.
   - Return the count of students now linked so the UI can show it.
6. **Remove the "email already exists" 400 short-circuit** — that block is what currently blocks reuse; it goes away.
7. **Remove the entire pre-create cleanup / delete block** (lines ~138–188) and remove the failure-path `deleteUser` after parent insert (line ~274). No deletes anywhere in this function.

### Client side
`src/pages/Onboarding.tsx` — no change needed. It already calls the function once, guards double-clicks, and displays `linkedStudents` from the response. The message just changes from "created" to "created or linked" (handled server-side in the response `message`).

### Result for Rebecca / Becca
Re-running onboarding for `beckyapan@gmail.com`:
- Finds Rebecca's existing Auth user, resets password to `classbeyond123!`.
- Finds Rebecca's existing `parents` row, updates `user_id` to that Auth user, keeps the same `parents.id`.
- Finds Becca (`students.email = beckyapan@gmail.com`) and links `parent_id`.
- Nothing is deleted. Becca stays in the Clients list. History, insights, attendance, lessons — all untouched.

### Not in scope
- No schema/migration changes.
- No changes to trial approval, HubSpot, or the welcome email — those already run in Step 3.