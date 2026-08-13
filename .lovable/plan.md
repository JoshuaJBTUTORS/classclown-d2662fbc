# Lesson summary failures: audit and fix

## What the audit found (since 20 July 2026, when briefs began)

404 transcript records, of which **131 lessons never produced a single student summary** — so no topics, no homework brief, and nothing for the weekly HeyCleo sync to pick up. They fall into four distinct failure modes:

| Failure | Count | State | Cause |
|---|---|---|---|
| Transcript never arrived | 81 | `processing`, no URL, 0 attempts | LessonSpace never delivered `transcription.finish`, and polling never returned a URL. Rows sit untouched forever. |
| Transcript URL expired before fetch | 35 | `available`, URL present, `expires_at` in the past | The URL was stored but the text was never downloaded in time (12–24h validity). |
| Summary generation failed | 10 | `completed`, text present | Transcript downloaded fine; the summary job never produced rows and nothing retried. |
| Retry ceiling hit | 2 | `error`, text present | "Maximum processing attempts exceeded" after 4 attempts, despite 67k chars of usable transcript. |

Gregory Dacosta is an example of the two most common modes: his 5 Aug GCSE Maths lesson is in the "never arrived" bucket and his 6 Aug KS3 Maths lesson is in the "retry ceiling" bucket — hence an empty week and nothing to sync.

## Why nothing self-heals

`hourly-lesson-processing` only looks at lessons that ended within the **last 24 hours**. Once a lesson falls out of that window — whichever way it failed — it is never looked at again. There is also no visibility: a failed lesson looks identical to a lesson that simply had no transcript.

Additionally, summary generation is invoked fire-and-forget from the hourly job, so a failure inside it leaves the transcript marked `completed` with no summaries and no error recorded anywhere.

## Plan

### 1. Recover what is recoverable now
- The 12 records that still hold transcript text (10 `completed` + 2 `error`) can be re-summarised immediately from stored text. Re-run summary generation for those lessons and confirm briefs appear.
- The 35 expired-URL and 81 never-delivered records have no text. For these, attempt a one-off re-poll of the LessonSpace transcript API by session id; anything LessonSpace still holds gets recovered, the rest is permanently lost and should be marked as such rather than left looking pending.

### 2. Add a recovery pass so this stops accumulating
A new scheduled function (daily) that looks back 14 days, not 24 hours, and handles each mode:
- `processing` with no URL and lesson ended >6h ago → re-poll LessonSpace for the transcript.
- `available` with URL and no text → download the text before it expires.
- `completed`/`error` with text and no summaries → re-run summary generation.
- Cap attempts and record the reason on the row so a permanent failure is explicit, not silent.

### 3. Make failures visible
- Record a terminal state (`unavailable`) with a human-readable reason when recovery is exhausted, instead of leaving rows in `processing` indefinitely.
- Add an admin view listing lessons from the last 30 days with attendance but no summary, grouped by failure mode, so a bad week is spotted before a parent reports it.

### 4. Re-sync affected weeks
Once recovery has run, re-run the weekly HeyCleo sync for the weeks touched by recovered briefs, limited to the affected students so nobody is messaged twice.

## Technical notes

- Buckets are derived from `lesson_transcriptions` joined against `lesson_student_summaries`; no schema change is needed beyond an extra status value and a `recovery_attempts` counter to bound retries.
- Recovery reuses `generate-lesson-summaries` (`get-transcription` action and the summary path) — no new AI logic.
- Summary invocation from the hourly job should record its outcome rather than being fully fire-and-forget, so failures land on the transcript row.
