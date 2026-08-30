# Duplicate student records: audit and tidy-up

## What the check found

The `students` table holds 899 rows. Duplicates fall into three clearly different groups.

### 1. The "phantom sibling" block — student IDs 808 to 908 (101 rows)

Verified facts about these rows:

- All 101 rows are `account_type = trial`, `status = active`, every row has a subject filled in (one subject per row, e.g. "KS3 Maths").
- 0 of them have a login account (`user_id` is empty), only 1 has an email address.
- Only **one** row in the whole block (ID 907, Fola Lawal) has any activity attached: 45 lesson links, 21 attendance rows, 18 lesson insights, 2 homework status rows. **The other 100 rows have zero links of any kind** — no lessons, no attendance, no homework, no insights, no progress.
- 79 of the 101 rows share a first name with an older child already attached to the same parent (e.g. Manju Mathai's "Amelia" 829 vs "Amelia Joe" 360 with 182 lessons).
- 21 rows have a different first name but the parent already had other children. Several of these are still duplicates with messy spelling: "Sofia" 827 vs "Sophia Ciopec" 452, "Ella May macarthur" 833 vs "Ella-May Bennett" 70, "Alexandru" 880 vs "Alex Zinici" 290, "Dylan" 873 vs "Dylan Adofo" 526, "Ching" 838 vs "Hei Ching Fan" 303, "Edward iancu-Lucuta" 823 vs "Eddie Lucuta" 772. Others look like genuinely new siblings (Comfort Onabanjo, Dorcas Teknikio, Nandini Dave, Emmanuel Ohi, Connor McLeod).
- 1 row (907) belongs to a parent with no older children, and it is the one row that is actually in use.

Conclusion: this block is a batch-created set of one-row-per-subject records. It is not proven which tool created it (no migration and no current app or edge-function code path produces this shape), but the rows are inert data, so we do not need to know the origin to clean it up.

### 2. Older name duplicates outside that block

A smaller set of genuine older duplicates where both rows have activity, so they need merging rather than deleting:

- Zoya (662: 40 lessons / 676: 18 lessons) — same parent.
- Faruq Orunsolu (240: 2 / 242: 23) — same parent.
- Oscar (78 Chow: 41 / 485 Kai Jie He: 4 / 865: 0) — same parent, three rows.
- Illia (444: 20 / 874: 0 / 875: 0), Michael (258: 44 / 905: 0 / 906: 0) — the extra rows are from the 808–908 block.
- Timmy Ekundayo (91 / 228) and James Shame (267 / 840) — no lessons on either; 91 and 267 hold the login account.
- Wiktor Szymanski (197 / 818) — no lessons on either.
- A set of first-name-only rows with no parent (Andri, Bria, Jayden, Mike, Abdullah, Olivia, Saba, Sara, Theo, Nikhil, Ayaan Ali, Timmy) each with 2 lessons — these are trial-booking rows, see group 3.

### 3. Trial booking rows with no parent (443 rows)

All 443 parentless rows are `account_type = trial` with an email, no login, and 432 of them have lessons (their trial lesson). These are **not fake** — they are the normal output of the public book-a-trial flow. Only 4 email addresses are duplicated among them (6 extra rows), and 12 of them share an email with an existing parent, meaning the child converted to a client but the trial row was never merged.

## How to tell real from fake

The reliable signal is **linked activity plus identity**, not the name:

```text
REAL  = has lesson links / attendance / homework / insights
        OR has a login account (user_id)
        OR is the row the parent's active lessons point at
FAKE  = zero links anywhere, no user_id, no email,
        created as one-subject-per-row inside the 808-908 block
```

Every row I propose deleting is checked against all six link tables (lesson_students, lesson_attendance, homework_submissions, homework_completion_status, student_lesson_insights, student_progress) at delete time, so a row with any history cannot be removed by accident.

## Proposed tidy-up

**Phase 1 — delete the inert phantom block (safe, reversible via backup table).**
Copy the 100 zero-link rows from IDs 808–908 into a `students_archive_2026_08` backup table, then delete them. ID 907 is kept and left untouched. This alone removes the visible duplicate children (including Manju's Amelia and Daniel) with no data loss.

**Phase 2 — merge the real duplicates.**
For the pairs where both rows have lessons (Zoya, Faruq, Oscar, and any others surfaced by the merge report), repoint lesson_students, lesson_attendance, homework and insight rows to the surviving ID (the one with the most history and the better-formed name), then archive and delete the loser row. This is done one pair at a time with a before/after count, not in bulk.

**Phase 3 — merge trial rows into converted clients.**
For the 12 parentless trial rows whose email matches a parent, and the 6 duplicate-email trial rows, attach them to the correct parent/child instead of leaving standalone trial records.

**Phase 4 — prevent recurrence.**
Add a partial unique index on `students (parent_id, lower(first_name), lower(coalesce(last_name,'')))` where `parent_id is not null`, so the same child cannot be inserted twice under one parent again.

## Technical notes

- Phases 1–3 are data changes (archive table + deletes/updates), Phase 4 is a schema migration.
- Nothing in the app UI changes; `/students` and `/students-list` simply stop showing the phantom rows.
- Before each delete I re-run the six-table link check inside the same statement, so the delete is a no-op for any row that gained history in the meantime.

## Question before I start

Do you want me to run all four phases, or start with Phase 1 only (delete the 100 inert phantom rows) and review the result before touching the real merges?
