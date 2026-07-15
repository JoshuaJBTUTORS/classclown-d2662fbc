# Adopt LessonSpace's recommended transcript flow

## Current state vs. LessonSpace docs

Our auth header (`Authorization: Organisation <key>`) and the transcript endpoint (`GET /v2/organisations/20704/sessions/{id}/transcript/`) are correct. Everything else diverges from what LessonSpace documents as best practice.

| Area | Today | Docs recommend |
|---|---|---|
| Delivery mechanism | Poll from **4 separate cron/edge functions** hitting the same GET endpoint | Subscribe to `webhooks.transcription.finish` — pushed the moment the transcript is ready |
| URL validity | 12h (poll path) | **24h** if delivered via webhook — more headroom before expiry |
| Session ID discovery | Fragile ±30-min time-window heuristic against the sessions-list endpoint (`daily-lesson-processing/index.ts:210-271`) + `find-lesson-sessions` (`hourly-lesson-processing/index.ts:88-114`) | `webhooks.session.end` pushes `{session.id, room.id}` at close — no guessing |
| Transcript body parsing | Guesses at `{transcript}` / `{text}` / `{transcription}` / string shapes (`generate-lesson-summaries/index.ts:688-700`) | Documented shape is an **array** `[{start_time,end_time,user:{id,name},breakout_id,text}]` |
| Body fetch timing | Fetched **on the hot path** during summary generation **and** duplicated inside `hourly-lesson-processing` — race + double S3 fetch | Fetch once, off the hot path, immediately after URL is known |
| Retry accounting | `MAX_PROCESSING_ATTEMPTS` exists only for AI summarization; transcript fetch polls indefinitely | Cap + backoff (webhook path has this built in; polling fallback should mirror) |
| Eligibility gating | None — <5 min or single-user sessions poll forever | Docs: transcripts only generated for sessions >300s with >1 user |

## Plan

### Step 1 — Find & inspect the LessonSpace Launch call
Locate the file that creates the LessonSpace space/room (not in the 4 files already reviewed). Confirm we're setting `transcribe: true` and enabling AV recording — without those, no transcript is ever generated regardless of extraction method. Note the exact JSON body shape so we know where to add the `webhooks` block.

### Step 2 — Add webhook subscriptions to the Launch payload
Extend the Launch API body with:
```json
"webhooks": {
  "session":       { "end":    "https://<project>.functions.supabase.co/lessonspace-session-webhook" },
  "transcription": { "finish": "https://<project>.functions.supabase.co/lessonspace-transcript-webhook" }
}
```
Persist the returned space `secret` (used later for HMAC verification) alongside the existing `lesson_space_room_id` / `lesson_space_space_id` columns.

### Step 3 — New inbound webhook: `lessonspace-transcript-webhook`
- Verify `x-webhook-signature` (HMAC-SHA256 of the raw body using the space secret) and `x-webhook-timestamp`.
- Upsert `lesson_transcriptions` by matching payload `session.id` → existing `lesson_space_session_id`; set status `available`, `expires_at = now() + 24h`.
- Immediately fetch the pre-signed URL **once**, parse the documented array schema, join `text` fields into `transcription_text`, set status `completed`.
- Return 2xx within 30s to avoid LessonSpace's retry/backoff.

### Step 4 — New inbound webhook: `lessonspace-session-webhook`
- Same signature verification.
- On `session.end`, write `session.id` into `lessons.lesson_space_session_id` for the matching `lesson_space_room_id`. This retires the time-window guessing in `findLessonSpaceSession` and the `find-lesson-sessions` invocation.

### Step 5 — Fix the transcript-body parser
Rewrite the shape-guessing block at `generate-lesson-summaries/index.ts:688-700` to parse the real documented array: `segments.map(s => `${s.user.name}: ${s.text}`).join('\n')` (or similar). This fix belongs in one place — the webhook handler — with the old callers removed.

### Step 6 — Collapse the 4 pollers into 1 fallback
- Remove transcript-fetch logic from `hourly-lesson-processing` (`ensureTranscription`, `index.ts:182-286`) and from `daily-lesson-processing` (`getTranscription` + heuristic session lookup).
- Keep exactly one fallback: reduce `pollPendingTranscriptions` in `generate-lesson-summaries` (`index.ts:919-990`) to run every few hours (not every request), with `MAX_TRANSCRIPT_FETCH_ATTEMPTS = 5` and exponential backoff. Its only job: catch webhooks that permanently failed after LessonSpace's 5 retries.
- Delete `supabase/functions/process-lesson-transcripts/` (redundant fourth entry point).

### Step 7 — Eligibility gate
Before creating a `processing` row (or polling the fallback), check lesson duration ≥ 300s AND participant count > 1. Otherwise mark `error` with reason `"ineligible_for_transcription"`. Prevents infinite polling of short/solo sessions.

### Step 8 — Verify
- Deploy webhooks. Book/finish a real short test lesson (≥5 min, 2 participants). Confirm:
  - `session.end` webhook fires → `lesson_space_session_id` populated without cron delay.
  - `transcription.finish` webhook fires → row goes `available` → `completed` in a single call, with real text.
- Check `supabase--edge_function_logs` for signature-verification failures.
- Confirm poll fallback is quiet (should almost never do work).

## Technical notes

- Files touched: the yet-to-be-found Launch caller; new `supabase/functions/lessonspace-transcript-webhook/index.ts`; new `supabase/functions/lessonspace-session-webhook/index.ts`; slimmed `generate-lesson-summaries/index.ts`; slimmed `hourly-lesson-processing/index.ts` and `daily-lesson-processing/index.ts`; deleted `process-lesson-transcripts/`.
- Both new webhook functions need `verify_jwt = false` in `supabase/config.toml` (LessonSpace calls them, not our authed users).
- No new secrets: existing `LESSONSPACE_API_KEY` covers outbound; space `secret` for HMAC verification comes back on each Launch call and should be stored per-lesson (new column on `lessons`, e.g. `lesson_space_webhook_secret`).
- No schema changes for `lesson_transcriptions` — existing columns cover the new flow. One column addition on `lessons` for the webhook secret.

## Explicitly out of scope

- Backfilling the 1,451 rows stuck in `processing` and 2,103 in `available` (per your instruction).
- Video recording playback flow (`get-lessonspace-recording`) — separate 3h URL lifecycle, not touched here.

## Open items to confirm before Step 2

1. Location of the LessonSpace Launch API call — need to grep `rg -l "record_av|transcribe|api.thelessonspace.com" supabase/functions src` to find it.
2. Whether `transcribe: true` is currently set at Launch (if not, no transcripts have ever been eligible regardless of extraction path).
3. Whether any prior LessonSpace inbound webhook receiver already exists to reuse patterns from.
