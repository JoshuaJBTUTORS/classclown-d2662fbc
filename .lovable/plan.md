## Problem

Step 1 fails with:
> insert or update on table "lesson_proposals" violates foreign key constraint "lesson_proposals_parent_id_fkey"

## Root cause

- `lesson_proposals.parent_id` FKs to **`auth.users(id)`**.
- `students.parent_id` FKs to **`parents(id)`**.
- The onboarding code uses a single `createdParentId` set to `data.parent.id` (the `parents` table row id) and passes it to both — so the proposal link fails, and the Step 3 lesson lookup would also be wrong.

`create-parent-account` already returns `parent: parentData`, which includes both `id` (parents.id) and `user_id` (auth user id).

## Fix (single file: `src/pages/Onboarding.tsx`)

- Track two ids in state: `createdParentRowId` (parents.id) and `createdParentUserId` (auth.users.id).
- When linking the proposal, use `data.parent.user_id`.
- In `handleCheckLessons`, query `students.parent_id = createdParentRowId`.
- Rename the existing `createdParentId` reference sites accordingly; no other files need changes.

## Verification

- Select the same completed proposal, click Create parent account — no FK error, proposal disappears from picker, wizard advances to Step 2.
- On Step 3, "Check lessons" finds lessons for students linked to the new parent.
