
## Goal

Prove the transcript/recording storage pipeline works end-to-end by running a past LessonSpace session (one we know completed cleanly and has a transcript on LessonSpace's side) through the exact same code path the live webhook uses — without waiting for a new live session.

## Why this is needed

LessonSpace only fires `transcription.finish` / `session.end` webhooks once, at the moment the session ends. We can't ask them to resend historical webhooks. So to validate the pipeline against a real, known-good session we have to synthesize the webhook call ourselves, using real IDs pulled from LessonSpace's API.

## Approach

Add a new admin-only edge function `lessonspace-replay-session` that takes a `lesson_space_session_id` (or a `lesson_id`) and does the following:

1. Calls the LessonSpace API to fetch that session's metadata:
   - `GET /v2/sessions/{sessionId}` → confirms room id, start/end, duration
   - `GET /v2/sessions/{sessionId}/transcription` → returns the signed transcript URL (12h validity)
   - `GET /v2/sessions/{sessionId}/playback` → returns the recording URL
2. Builds a payload that matches the real webhook shape:
   ```json
   { "room": { "id": "..." }, "session": { "id": "..." }, "transcriptionUrl": "..." }
   ```
3. Invokes the existing `lessonspace-transcript-webhook` function internally (server-to-server, service role) with that payload — **skipping signature check** by passing an internal `x-replay-token` header the webhook trusts only from the service role. This exercises the same parse → fetch → store code path used in production.
4. Separately writes the recording URL directly to `lessons.lesson_space_recording_url` for the matched lesson (same logic `get-lessonspace-recording` already uses).
5. Returns a summary: whether the transcript was stored, size in bytes, recording URL, matched lesson id.

## UI

Small admin panel section (only visible to admins) at `/admin/lessonspace-replay` with:
- Input: session id OR lesson id
- Button: "Replay session through webhook"
- Result panel showing the JSON summary from the edge function

## Picking a known-good session

To find a real session id to replay, the plan includes running a quick query against `lessons` to list rows where `lesson_space_session_id IS NOT NULL AND lesson_transcript IS NOT NULL` (or the equivalent transcript table) — those are sessions that previously produced a transcript successfully. You pick one from that list; we replay it and confirm the pipeline re-stores the same content.

## Files touched

- `supabase/functions/lessonspace-replay-session/index.ts` (new)
- `supabase/functions/lessonspace-transcript-webhook/index.ts` (add trusted-replay bypass on `x-replay-token` matching a new secret)
- `src/pages/admin/LessonSpaceReplay.tsx` (new, admin-gated)
- `src/App.tsx` route + sidebar entry under admin tools
- New secret: `LESSONSPACE_REPLAY_TOKEN`

## What this proves (and doesn't)

Proves: our matcher, transcript fetch, parse, storage, and recording-URL update all work against real LessonSpace data.

Does NOT prove: that LessonSpace is actually delivering webhooks to us in the wild — that still requires one clean live session where someone stays in the room long enough for LessonSpace to end a session naturally. Both checks are needed; this plan covers the first.
