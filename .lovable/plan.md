## Goal

Activate the family's students at **step 1** of Cleo Onboarding — the moment the parent account is created — so they are no longer `trial` and immediately appear in the calendar's student pickers before lessons are scheduled in step 3.

## What I verified

- `public.students.status` is a text column with values: `active`, `inactive`, `trial`, empty string.
- `public.parents` has **no** status column; its only comparable field is `account_type`, and all 286 rows are already `regular`. There is no parent-side "trial" value to change — parent trial state is effectively derived from their students.
- `supabase/functions/create-parent-account/index.ts` already resolves the whole family at step 1: it finds or creates the `parents` row, then collects students by matching email (3a) and via stale duplicate parent rows (3b), and links them all to the new `parent_id` (lines 187-231).
- The calendar student pickers filter to `active`/null/empty (`src/components/lessons/AddLessonForm.tsx` line 176, `src/hooks/useStudentData.ts` line 17), which is why trial students can't be added to a lesson today.

## Plan

1. In `supabase/functions/create-parent-account/index.ts`, after the existing student-linking block (~line 231), add an activation step:
   - Take the full set of resolved student IDs — the `toLink` map plus any student already on `parent_id`, so students that were already linked also get promoted.
   - Update every one of those rows whose `status` is `trial`, empty, or null to `status = 'active'`.
2. Return an `activatedStudents` count in the response and fold it into the existing `message` string (e.g. "Parent account ready. Linked 2 student(s), activated 2.").
3. Log any activation error to the function console but do **not** fail the request — parent creation must still succeed.
4. In `src/pages/Onboarding.tsx` (`handleCreateFromProposal`), surface the returned count in the existing success toast so the admin can see the students were activated before moving to step 2.

## Notes

- Nothing changes at step 3 / `handleAddedLessons`.
- `inactive` students are deliberately left alone — only `trial`/blank statuses are promoted.
- No database migration is needed; this is an update to existing rows plus a small response change.
