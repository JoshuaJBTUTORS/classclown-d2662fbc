## Revised current state (verified against LessonSpace docs)

Per LessonSpace's official webhook docs (`/docs/guide/webhooks`):
- Webhooks are set **only** via the Launch endpoint payload. There is no org-level registration API. Any new Launch call for the same space fully overwrites the webhooks.
- Only these events exist: `session.{start,end,idle}`, `user.{join,leave,idle}`, `chat.message`, `cobrowser.{start,stop}`, `transcription.finish`, `knock.{request,admit,deny}`.
- **`recording.finish` is not a real event.** Recordings must be retrieved via the recordings API/polling — no webhook exists.
- The signing secret is returned in the Launch API response and is per-space.
- Signature = `HMAC-SHA256(JSON.stringify(body), spaceSecret)`, header `x-webhook-signature`.

Confirmed against our data:
- 194 recent lessons have `lesson_space_webhook_secret` populated → LessonSpace accepted the inline `webhooks` block and returned a secret.
- Multiple lessons have already ended (e.g. `e5fd9948…`, ended 2026-07-21 17:00) with a secret stored, yet **zero** invocations recorded for `lessonspace-transcript-webhook` or `lessonspace-session-webhook`.
- Transcripts remain `processing`, updated only by the hourly poll.
- `lessonspace-recording-webhook` will never fire — the event doesn't exist. Recording capture must stay on the polling/GET path.

So the fallback is doing all the work, and the reason webhooks aren't landing is not "org-level vs inline" — it's something in the current inline registration or delivery path.

## Revised plan

### 1. Fix the launch payload
- Remove `recording: { finish: ... }` from every Launch payload in `supabase/functions/lesson-space-integration/index.ts` (4 call sites: primary tutor launch, primary student launch, dynamic student launch, on-demand student launch). This is not a valid event; sending it may be causing LessonSpace to reject or ignore the whole `webhooks` block silently.
- Keep `session.end` and `transcription.finish` inline. Optionally add `session.start` so we get "actually joined" signal.

### 2. Delete the recording webhook (dead code)
- Delete `supabase/functions/lessonspace-recording-webhook/` and its entry in `supabase/config.toml`. Recording continues via the existing polling path in `hourly-lesson-processing` + `get-lessonspace-recording`.

### 3. Prove delivery works with a controlled probe
- Add a tiny `console.log` at the top of both remaining webhook handlers that logs headers + raw body length so any attempted delivery — successful signature or not — is visible in logs.
- Launch one fresh test lesson, end it, then check within ~5 min:
  - `lessonspace-session-webhook` logs an incoming request for `session.end`.
  - `lessonspace-transcript-webhook` logs an incoming request for `transcription.finish`.
- If they arrive: confirm signature verification passes and the transcript row flips to `completed` with a non-null `transcript_size_bytes`.
- If nothing arrives even after the payload cleanup, the next step is to open a LessonSpace support ticket with our session id — at that point the issue is on their side, not ours.

### 4. Tighten the fallback
- Leave `hourly-lesson-processing` in place as the safety net (transcripts + recordings), with its existing `end_time <= now() - 3h` guard.

## Out of scope
- No backfill of `processing` rows.
- No changes to summary/insight generation — both paths already fan out to `generate-lesson-summaries`.
- No changes to non-LessonSpace edge functions.
