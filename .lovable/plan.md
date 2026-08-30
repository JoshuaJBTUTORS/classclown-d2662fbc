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

They are not created by the app's forms or by any edge function — no student insert path produces a row with no surname, no email, `account_type = 'trial'` and `status = 'active'` while setting a `subjects` string.

They came from a one-off bulk import: student IDs **808–908** are a single contiguous block of 73 such rows, ordered by parent UUID, one row per parent/subject combination. Only one row in that whole block (ID 907) is attached to any lesson. So the import created a fresh student row per parent/subject instead of matching against the children that already existed for that parent — Manju already had Amelia and Daniel, so she ended up with a second copy of each.

This is a data problem, not a live bug: nothing in the current codebase will create more of these rows.

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
