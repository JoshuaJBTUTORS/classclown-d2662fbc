# Hajra's homework sync — what the data shows

## What actually happened

Hajra (student 688, parent Sonam, sayub09@gmail.com) **was** included in the last sync run:

- `heycleo_weekly_homework_sync` — status `sent`, week `2026-08-03`, **1 subject**, recorded 12 Aug 16:02.
- `weekly_homework_release` email and WhatsApp — both `sent` for the same week.

So the sync did not fail. What is missing is **Maths**: only KS2 English went across.

## Why Maths was left out

The run covers the London week Mon 3 Aug – Sun 9 Aug. Hajra's briefs in that window:

- 9 Aug (Sun) — 1-1 KS2 English — brief present → synced.
- 10 Aug (Mon) — 1-1 KS2 Maths — brief present, but 10 Aug is the **next** week, so it is not in this bucket.

Her Maths slot normally runs on a Saturday (18 Jul, 25 Jul at 10:00). The 10 Aug session sits on a Monday, so it fell just outside the week boundary and will only be picked up by the run that covers 10–16 Aug.

Two other things worth noting:

- There is a **duplicate student record** for Hajra (id 831, no email, no phone, same parent). It has no lessons or summaries, so it is inert today, but it will cause confusion in any future matching.
- Hajra's `students.email` is the parent's address (sayub09@gmail.com). Fine for notifications, but worth confirming this matches the HeyCleo account the homework should land in.

## Proposed actions

1. Run the sync for week `2026-08-10` limited to student 688 so the Maths brief goes across now, rather than waiting for Sunday. (Dry run first to confirm two subjects, then the real send with notifications off so the family is not messaged twice.)
2. Confirm with HeyCleo that the 3 Aug English payload landed on the correct child account, using the sync id for student 688 + week 2026-08-03.
3. Merge or delete the duplicate student record 831 so future syncs cannot split against the wrong row.

No code or schema changes are required for any of this — the sync function already accepts `week_start`, `student_ids`, `dry_run` and `notify: false`.

## Optional follow-up (only if you want it)

If sessions drifting across the Sunday/Monday boundary is a recurring problem, the sync could be widened to also sweep up any brief from the previous week that was created after that week's run. That is a change to `supabase/functions/weekly-homework-sync/index.ts` and would need its own pass.
