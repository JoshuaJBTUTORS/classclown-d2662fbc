# Duplicate children for Manju Mathai — findings and clean-up

## What I found

Manju Mathai (parent record `2f82f45b…`, login `gigokj@gmail.com`) has five child records:

| ID  | Name          | Email          | Subject         | Lessons linked |
|-----|---------------|----------------|-----------------|----------------|
| 360 | Amelia Joe    | gigokj@gmail.com | —             | 182 |
| 361 | Daniel Joe    | gigokj@gmail.com | —             | 143 |
| 362 | Michelle Joe  | gigokj@gmail.com | —             | 122 |
| 829 | Amelia (no surname) | none     | KS3 Maths       | 0 |
| 830 | Daniel (no surname) | none     | 11 Plus Maths   | 0 |

Rows 829 and 830 are the duplicates.

## Why they exist

The duplicate rows (829, 830) belong to a contiguous block of **101 rows with IDs 808–908** that all share the same unusual shape: `account_type='trial'`, `status='active'`, a populated `subjects` string, **no `user_id`**, and almost no email/last name (only 1 of 101 has an email, 28 of 101 have a last name). No application form or edge function produces a row shaped this way — every real insert path sets an email, a surname, or a `user_id`. Within the block, `parent_id` is monotonically non-decreasing with consecutive same-parent rows, i.e. rows are grouped by parent with one row per subject.

That shape and ordering is what a single batch insert produces, so this block was almost certainly created by one bulk operation. I could not find a migration file or code path that created it, so I can't say definitively whether it was a checked-in script or a manual SQL run in the dashboard — treat "bulk import" as an inference from the data, not a traced source.

Only one row in the whole block (ID 907) is attached to any lesson, so the duplicates are safe to merge/remove. Because the block predates the current code and nothing in the app recreates it, this is a data problem, not a live bug — no code change will stop it recurring because no code is producing it now.

## Proposed clean-up

1. Move the useful data across first: copy the subject from each duplicate onto the matching existing child where that child has no subject recorded (Amelia 360 ← KS3 Maths, Daniel 361 ← 11 Plus Maths), so nothing is lost.
2. Delete the two duplicate rows for Manju (829, 830). They have no lessons, no homework and no login attached, so removal has no knock-on effect.
3. Optionally extend the same treatment to the rest of the 808–908 import block: for every one of those rows, check whether the same parent already has a child with the same first name; merge the subject onto the existing child and delete the duplicate. Rows with no existing match (genuinely new children) are left alone, and ID 907 is left alone because it has 45 lessons.

I would run step 3 as a report first, so you can see the full list of proposed merges and deletions before anything is removed.

## Technical notes

- All work is SQL against `public.students`; no application code changes are needed.
- Before deleting, each candidate is verified to have zero rows in `lesson_students`, no `user_id`, and no linked homework/assessment records.
- Deletions run as an explicit list of IDs, not a broad `WHERE` clause.

## Scope question

Tell me whether to do just Manju (steps 1–2) or the whole import block (steps 1–3 with the report first).
