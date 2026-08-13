# Gregory Dacosta: why last week had no homework to sync

## What the data shows (confirmed)

Gregory (student 925) had two lessons in week Mon 3 – Sun 9 Aug 2026:

| Lesson | Date | Transcript state | Summary / homework brief |
|---|---|---|---|
| GCSE Maths Group | Wed 5 Aug 16:00 | `processing`, no transcript text ever fetched, no URL, 0 attempts | none |
| KS3 Maths Group | Thu 6 Aug 18:00 | `error` — "Maximum processing attempts exceeded", but 67k chars of text **are** stored | none |

By contrast, his 12 Aug GCSE Maths lesson transcribed cleanly (`completed`, 1 attempt) and produced summaries for all 3 students in the group, including a homework brief.

So the sync did not skip him — there was genuinely nothing to sync. The weekly sync only picks up students with a `homework_brief`, and no brief exists because no summary was ever generated for either lesson. The student page showing "0 lessons this week" is the same cause: `student_lesson_insights` rows are derived from those summaries.

Two distinct failures:

1. **5 Aug** — the transcript never arrived from LessonSpace. The row was created at 20:00 on 5 Aug and has sat in `processing` with no URL and zero processing attempts since. Nothing retried it.
2. **6 Aug** — the transcript text *did* arrive (67k chars) but summary generation failed 4 times and the record was marked `error` with the transcript expiring on 7 Aug. The stored text is still present, so this one is recoverable right now.

## Proposed fix

### Step 1 — recover Gregory's week (immediate)
- Re-run `generate-lesson-summaries` for the 6 Aug KS3 Maths lesson using the transcript text already in the database. This produces summaries and homework briefs for all students in that group, not just Gregory.
- Investigate the exact failure for that lesson from the edge function logs before re-running, so we fix rather than repeat it.
- The 5 Aug lesson has no transcript at all and cannot be recovered automatically. Confirm with the tutor whether that session ran; if it did, the brief has to be entered manually or the lesson left without homework.

### Step 2 — stop this happening silently
- Add a recovery pass (cron) that finds transcriptions which are (a) stuck in `processing` for more than 12 hours, or (b) in `error` but holding transcript text, and retries summary generation for them.
- Surface stuck/failed transcripts somewhere visible to admins so a missing week is noticed before a parent reports it.

### Step 3 — after recovery
- Re-run the weekly HeyCleo sync for week `2026-08-03` limited to the affected students, so the recovered briefs actually reach HeyCleo.

## Technical notes

- Affected records: `lesson_transcriptions` ids `74dae432…` (5 Aug, stuck) and `4c7e8bef…` (6 Aug, error with text).
- Recovery reuses `lesson_transcriptions.transcription_text`; no re-fetch from LessonSpace is needed for the 6 Aug lesson (its `expires_at` has passed, so the remote URL is likely dead anyway).
- The retry cron would call the existing summary-generation function; no schema changes required beyond possibly a `recovery_attempts` counter to avoid infinite loops.
