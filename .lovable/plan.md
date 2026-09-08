# Stop homework messages going to trial families

## Why it is happening

Neither homework job checks whether a family is an actual paying customer.

- The weekly homework release picks up any lesson that produced a homework brief, including trial and demo lessons. In the last 60 days that covered 24 trial lessons and 24 demo lessons belonging to students still marked as trial.
- The Wednesday and Friday nudges pick up any student who had a lesson that week, whatever the lesson type, and only skip students explicitly marked inactive. Trial students are not skipped.

Right now the student list holds 189 active, 453 trial, 161 with no status set, and 7 inactive.

## What changes

Both jobs will only message families who are active customers:

1. Homework is only built from regular lessons. Trial and demo lessons are ignored entirely, even for an existing active customer.
2. Only students marked active receive homework messages. Trial and inactive students are skipped.
3. Students with no status set are treated as active, so long-standing families whose record was never tidied up keep getting their homework. These are flagged in the run log so the list can be cleaned up.
4. Skipped students are counted and named in the run result, so a dry run shows exactly who was excluded and why.

## Technical notes

- `supabase/functions/weekly-homework-sync/index.ts`: add `lessons.lesson_type` to the summaries query and skip rows where it is `trial` or `demo`; after loading `students`, drop any whose `status` is `trial` or `inactive` (null/empty treated as active). Add `skipped_trial_student` and `skipped_trial_lesson` counters to the response.
- `supabase/functions/homework-nudge-reminders/index.ts`: restrict the eligibility lesson query to `lesson_type = 'regular'`, and replace the inactive-only filter with the same active-customer rule.
- No schema changes, no cron changes, no wording changes.
