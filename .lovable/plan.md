# Edge-case handling for `student_lesson_insights`

## How the pipeline behaves today

Insights are written by a trigger on `lesson_student_summaries`. That table is populated by the `generate-lesson-summaries` edge function, which runs once a transcript is available and creates **one row per enrolled student**, even if that student never spoke.


| Scenario                                | Transcript?   | Summary row created?                             | Insight row today                           | Problem                                                                                          | &nbsp;                                        | &nbsp;                                                     | &nbsp; |
| --------------------------------------- | ------------- | ------------------------------------------------ | ------------------------------------------- | ------------------------------------------------------------------------------------------------ | --------------------------------------------- | ---------------------------------------------------------- | ------ |
| Student didn't join                     | Yes (others   | Appears in weekly list as a normal lesson with " | spoke)                                      | Yes, with empty contributions and low/defaulted scoresno topics" and a misleading low confidence | Looks like the student attended and did badly | &nbsp;                                                     | &nbsp; |
| Student joined late                     | &nbsp;        | &nbsp;                                           | Appears normally with real (partial) scores | Yes                                                                                              | Yes, built from partial transcript            | Numbers are technically correct but not flagged as partial | &nbsp; |
| Lesson cancelled before it ran          | No transcript | No summary → no insight                          | Doesn't appear                              | Correct — nothing to do                                                                          | &nbsp;                                        | &nbsp;                                                     | &nbsp; |
| Lesson cancelled after it partially ran | Maybe         | Maybe                                            | Appears if summary exists                   | Should not count as a real lesson                                                                | &nbsp;                                        | &nbsp;                                                     | &nbsp; |


## What to change

### 1. Add attendance context to the insight row

Extend `public.student_lesson_insights` with three columns so the UI can filter and label rows correctly without extra joins:

- `attendance_status text` — mirrored from `lesson_attendance.status` for `(lesson_id, student_id)` at write time (`present`, `late`, `absent`, `no_show`, or `null` when unknown)
- `lesson_status text` — mirrored from `lessons.status` (`scheduled`, `completed`, `cancelled`, …)
- `is_meaningful boolean` — computed: `true` when the student was present/late **and** the lesson wasn't cancelled **and** there is at least one topic OR a non-null confidence score

### 2. Update the sync trigger

`sync_student_lesson_insight()` already reads the parent `lessons` row. Extend it to also read `lesson_attendance` for the same `(lesson_id, student_id)` and populate the three new columns. Recompute `is_meaningful` on every upsert.

Add a second lightweight trigger on `lesson_attendance` (`AFTER INSERT/UPDATE/DELETE`) that updates `attendance_status` + `is_meaningful` on the matching insight row so late attendance edits stay in sync.

Extend the existing `resync_insights_for_lesson()` trigger on `lessons` to also propagate `lesson_status` changes (e.g. lesson later marked `cancelled`) and re-evaluate `is_meaningful`.

### 3. Backfill

One-off `UPDATE` to fill `attendance_status`, `lesson_status`, and `is_meaningful` for existing rows from `lesson_attendance` + `lessons`.

### 4. Frontend behaviour in `useStudentWeeklyTopics` + `StudentDetail`

- **Default weekly list**: filter to `lesson_status <> 'cancelled'` and `attendance_status IN ('present','late') OR attendance_status IS NULL` (null = attendance never recorded, keep visible so nothing silently disappears).
- **Cancelled lessons**: hidden by default. Optional collapsed "Cancelled this week (N)" section at the bottom.
- **No-shows / absences**: hidden from the topics list (they shouldn't dilute understanding scores), but shown in a small "Missed lessons this week (N)" chip so parents can see them.
- **Late joins**: keep in the main list, but if `attendance_status = 'late'` render a small "Joined late" badge next to the lesson title and suppress the confidence % badge (show only "Joined late — partial data").
- **Empty summaries** (row exists but `topics = []` and `confidence_score IS NULL`): treat as "transcript still processing" wording already in the UI — no change needed, `is_meaningful = false` will exclude them from any future averages.

## Out of scope

- No changes to `generate-lesson-summaries` itself — still writes one row per enrolled student; we just interpret those rows correctly downstream.
- No weekly rollup / averaging table yet — `is_meaningful` is the flag a future rollup would filter on.
- No retroactive deletion of misleading historic insight rows; the flags make them harmless.

## Technical notes

- Trigger on `lesson_attendance` must be `SECURITY DEFINER` with `search_path = public` to match the existing pattern.
- `is_meaningful` stored (not generated) so it can be indexed if we later filter large ranges.
- Add index `student_lesson_insights (student_id, week_start_date) WHERE is_meaningful` for the common weekly-list query.