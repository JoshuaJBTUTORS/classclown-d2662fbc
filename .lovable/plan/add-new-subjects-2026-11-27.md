# Add new subjects

## What changes
- **A-level English** and **A-level Further Maths**: added next to the other A-level subjects. They appear everywhere subjects are picked, including the public trial booking pages.
- **GCSE Religious Studies**: added to the GCSE subjects for lessons, tutors, students and proposals, but **hidden from the trial booking pages** (main, Musa and Hopewell).

## Technical details
- Insert three rows into `subjects`: `A-level English` (a_level), `A-level Further Maths` (a_level), `GCSE Religious Studies` (gcse).
- `SubjectSelectionStep.tsx` (shared by all trial booking pages) gets a small exclusion list (`HIDDEN_FROM_BOOKING = ['GCSE Religious Studies']`) filtered out before grouping by category. Other screens are untouched.
