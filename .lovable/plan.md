## Root cause: the hourly cron ran out of time before reaching every lesson

The 1-1 A Level Maths lesson with Abdul (id `481d103a…`) is in a perfectly healthy state:

- `lesson_space_session_id`: set
- `lesson_space_recording_url`: set
- `lesson_transcriptions`: `completed`, 50,828 characters of text
- `lesson_student_summaries`: **0 rows**
- No `processing_notes`, no `last_processing_error`

So the transcript pipeline succeeded — only the summary generation step never fired for this lesson. Same story for `Demo Session for David Babatope`, `Trial KS3 Maths for David Babatope`, `11 Plus NVR Group`, and `1-1 Year 11 Combined Science`: all have completed transcripts and 0 summaries.

### Why summaries are missing for these specific lessons

`hourly-lesson-processing` walks every eligible lesson **sequentially** in a single edge-function invocation with `await new Promise(resolve => setTimeout(resolve, 2000))` between lessons and per-student OpenAI calls inside. When today's 17:00 UTC block ended (7 lessons ended within a single hourly window), the cron started processing them but hit the ~150s Supabase edge-function wall-clock limit partway through. Evidence:

- The GCSE English Group got 4 student summaries between 20:03:42 and 20:05:39 UTC — a single run doing them one at a time.
- Other 17:00-ended lessons never got a summary row inserted at all.
- `Trial KS3 Maths for David Babatope` (12:45 slot) also has a completed transcript but 0 summaries — the same crowded-window problem earlier in the day.

Combine that with the `todayStr is not defined` reference at the end of `hourly-lesson-processing/index.ts` (line 169) and you get: the loop is doing real work, then the response builder throws, the run is logged as failed, no retry is scheduled, and the missed lessons sit there forever because the next hourly window (`now-4h..now-3h`) no longer includes them.

### What I want to change

1. **Fix `todayStr` crash** in `hourly-lesson-processing` so the run returns cleanly.
2. **Widen the reprocessing window**: instead of a strict 1-hour slice, keep picking up any lesson that ended ≥3h ago **and still has a completed transcript with 0 summaries** (idempotency checks already prevent double-work). This is what lets missed lessons self-heal on later runs.
3. **Split summary generation off the hot cron path**: after the transcript is completed, invoke `generate-lesson-summaries` per-lesson as a fire-and-forget (like the webhook already does at `lessonspace-transcript-webhook` line 217). That way one slow OpenAI call for lesson A can't starve lesson B.
4. **Backfill the missing ones right now** by directly invoking `generate-lesson-summaries` for the 5 lessons that already have completed transcripts and 0 summaries (A Level Maths, Y11 Combined Science, 11 Plus NVR, both David Babatope trials).

### Not changing

The transcript webhook + LessonSpace integration itself — it's clearly working, just the downstream summary fan-out that starves.

Approve and I'll do step 4 first (immediate visible fix for today), then 1-3.