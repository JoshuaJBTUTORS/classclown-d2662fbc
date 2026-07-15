## Current state

**Transcripts (webhook path):** `lessonspace-transcript-webhook` receives `transcription.finish`, fetches the JSON, and stores `transcription_text` / marks `completed`. It does **NOT** trigger any downstream work — student summaries, revision, lesson_completion_badges, etc. still wait for the hourly poller (`hourly-lesson-processing` → `ensureSummaries`) to notice the row and call `generate-lesson-summaries`. Result: summaries can lag by up to an hour and rely on the same poll loop we just tried to move away from.

**Recordings:** Still 100% polled. `hourly-lesson-processing` and the on-demand `get-lessonspace-recording` hit `/v2/sessions/{id}/playback`. Same fragility we had with transcripts: URL expiry, missing session IDs, no retry accounting, no push notification when the recording is actually ready.

LessonSpace publishes two more webhook events we're not using:
- `recording.finish` — pushed when the AV recording is processed and downloadable
- (already using) `transcription.finish`, `session.end`

## Plan

### 1. Fire downstream work directly from the transcript webhook
In `lessonspace-transcript-webhook/index.ts`, after a successful `completed` upsert, invoke `generate-lesson-summaries` (`action: "generate-summaries"`) with `lessonId` + the new `transcription.id`. Fire-and-forget (don't block the 200 back to LessonSpace). This makes summaries land seconds after the transcript instead of up-to-an-hour later, and matches the same push model we chose for transcripts.

Keep the hourly poll as a low-frequency safety net only.

### 2. Add a `recording.finish` webhook
New edge function `lessonspace-recording-webhook`:
- `verify_jwt = false` in `supabase/config.toml`
- HMAC-SHA256 verify using the same per-space `lesson_space_webhook_secret` already stored on `lessons`
- Look up the lesson by `session.id` (fall back to `room.id`)
- Write `lessons.lesson_space_recording_url` + a new `lessons.lesson_space_recording_expires_at` timestamp (24h from webhook, vs 12h on the poll GET)
- Log + return 200

### 3. Register the recording webhook at launch
In all four Launch API bodies inside `lesson-space-integration/index.ts` (tutor + student, both create paths — lines ~227, ~291, ~487, ~646), extend the `webhooks` block:
```
webhooks: {
  session: { end: sessionWebhookUrl },
  transcription: { finish: transcriptWebhookUrl },
  recording: { finish: recordingWebhookUrl }
}
```

### 4. Schema (tiny)
Migration: add `lessons.lesson_space_recording_expires_at timestamptz` so the frontend player can decide when to force a fresh fetch. No new grants/RLS (existing lesson policies cover it).

### 5. Simplify the pollers
- `hourly-lesson-processing`: keep as a fallback but drop the "call get-lessonspace-recording per lesson" step to something rarer (e.g. only when `lesson_space_recording_url IS NULL AND end_time < now() - 6h`). Same for transcript polling.
- Leave `get-lessonspace-recording` in place for the "user pressed play and we still don't have a URL" edge case — it's now the fallback, not the primary path.

### 6. Verify
- Book one test lesson, end it, confirm in edge-function logs: `session.end` → `transcription.finish` → summaries invoked → `recording.finish` → recording URL stored, all within a couple of minutes and with no polling involvement.

## Files touched

- `supabase/functions/lessonspace-transcript-webhook/index.ts` — invoke `generate-lesson-summaries` on completed upsert
- `supabase/functions/lessonspace-recording-webhook/index.ts` — **new**
- `supabase/functions/lesson-space-integration/index.ts` — register recording webhook in 4 Launch bodies, persist nothing extra (secret already saved)
- `supabase/config.toml` — `verify_jwt = false` for the new webhook
- `supabase/functions/hourly-lesson-processing/index.ts` — de-prioritise recording/transcript polling
- One migration for `lessons.lesson_space_recording_expires_at`

## Out of scope
- Backfilling stuck rows (per your earlier call)
- Any UI change to `LessonSpacePlayer` beyond it continuing to read `lesson_space_recording_url`
- Video/summary business logic changes
