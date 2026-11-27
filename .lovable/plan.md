# Add A-level English as a subject

## What changes
- Add a new subject called **A-level English** alongside the other A-level subjects (Biology, Maths, Physics, etc.).
- It will then show up everywhere subjects are picked: lessons, tutor subjects, students, proposals and trial bookings, as all of these read from the same subject list.

## Technical details
- One database change: insert a row into `subjects` with name `A-level English`, category `a_level` (matching the existing "A-level ..." naming).
- No code changes needed; subject dropdowns load from the `subjects` table.
- If you would prefer separate "A-level English Language" and "A-level English Literature" (like the GCSE ones), say so and I will add both instead.
