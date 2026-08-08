# Give Agent Cleo real knowledge of tutors

Agent Cleo already has read access to every table in the database, but nothing tells it where tutor working hours, pay rates, subjects and time off actually live, or how those values are formatted. So it either misses them or guesses. This plan teaches it that domain and gives it one purpose-built tool so answers are fast and consistent.

## What Agent Cleo will be able to answer

- "What days and hours does Iulian work?"
- "Which tutors can teach GCSE Chemistry on Tuesday evening?"
- "What is Scott's normal and absence hourly rate, and what did he cost last month?"
- "Is anyone off next week, and does that clash with their scheduled lessons?"
- Before proposing a lesson: "That slot is outside their availability" / "They have approved time off that day" / "They already have a lesson then".

## Changes

### 1. Tutor domain knowledge in the system prompt

Add a "TUTORS" section to the Agent Cleo prompt naming the tables and their quirks:

- `tutors` — name, email, phone, `status` (`active` / `inactive`), `title`, `bio`, `education`, `rating`, `specialities` (text array), `normal_hourly_rate`, `absence_hourly_rate`.
- `tutor_availability` — weekly recurring working pattern. `day_of_week` is a capitalised day **name** (`Monday`…`Sunday`), `start_time`/`end_time` are plain times in Europe/London (not UTC).
- `tutor_subjects` → `subjects` — what each tutor can teach; join through `subject_id`.
- `time_off_requests` — `start_date`/`end_date` timestamptz, `status` is `pending` / `approved` / `denied`. Only `approved` blocks work; mention pending ones as a risk.
- `lessons` + `lesson_students` — actual scheduled load, stored in **UTC**, so convert before comparing to availability times or spoken London times.
- Pay rates are sensitive: report them when asked, never volunteer them in unrelated answers.

### 2. New `tutor_snapshot` tool

One tool call, given a tutor name or id, returning a single structured object:

- profile + status + both hourly rates
- weekly availability grouped by day
- subjects they teach
- approved and pending time off in the next 60 days
- upcoming lessons (next 14 days) with any that fall inside time off flagged as a clash
- weekly scheduled hours vs available hours

If the name matches more than one tutor, it returns the candidates so Cleo asks which one instead of guessing.

### 3. Availability awareness when proposing lessons

Extend the existing `propose_lesson` / `propose_lesson_edit` validation so the confirmation card also shows warnings when the chosen tutor is:

- outside their `tutor_availability` window for that weekday,
- on approved time off,
- already booked for an overlapping lesson,
- not linked to that subject in `tutor_subjects`.

These are warnings, not blocks — the user can still confirm.

## Technical notes

- All work is in `supabase/functions/agent-cleo/index.ts`: prompt text, one new entry in the `tools` array plus its handler, and extra checks inside `buildLessonProposal` / the edit builder.
- Reads go through the existing `agent_cleo_exec` path, which is already SELECT-only, so no new write surface and no schema migration.
- Times: availability is London local, lessons are UTC — the snapshot converts lesson times with `AT TIME ZONE 'Europe/London'` before comparing.
