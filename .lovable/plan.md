## Current state (verified)

- All three LessonSpace webhook endpoints are deployed, public, and correctly configured (`verify_jwt = false`); a manual POST returns the expected validation error, so the URL is reachable.
- Zero invocations logged for `lessonspace-transcript-webhook`, `lessonspace-recording-webhook`, `lessonspace-session-webhook` since deploy.
- Every recent `lesson_transcriptions` row is stuck at `transcription_status = 'processing'`, with `transcript_size_bytes = null`, and `updated_at` timestamps matching the hourly cron — i.e. the polling fallback in `hourly-lesson-processing` is still doing 100% of the work.
- 194 lessons launched in the last 3 days have `lesson_space_webhook_secret` populated, so the inline per-launch webhook block is being accepted by LessonSpace, but no callbacks are being made.

Conclusion: the new webhook path is not working; we're entirely on the old fallback.

## Plan to fix

### 1. Confirm the root cause with LessonSpace
- Pull one recent launch's stored `lesson_space_webhook_secret` + `lesson_space_session_id` and cross-check with LessonSpace support/docs whether inline `webhooks` on `POST /v2/spaces/launch/` are actually honoured, or whether webhooks must be registered once at the organisation/space level via a separate endpoint.
- Confirm the exact header LessonSpace sends (`x-webhook-signature` vs `x-lessonspace-signature`) and the signing scheme, so our HMAC check matches.

### 2. Register webhooks at the org/space level (expected fix)
- Add a one-time setup edge function `lessonspace-register-webhooks` that calls the LessonSpace org-level webhook registration endpoint for `session.end`, `transcription.finish`, and `recording.finish`, pointing to our three edge functions. Store the returned organisation-level `secret` in a new `app_settings` row (`lessonspace_org_webhook_secret`).
- Update the three webhook handlers to verify against that org-level secret when present, falling back to the per-lesson secret for compatibility.
- Stop attaching `webhooks` inline in `lesson-space-integration` launch payloads once org-level registration is in place (keep the per-launch block only if LessonSpace supports both).

### 3. Verify end-to-end
- After registration, launch a real test lesson, end the session, and confirm:
  - `lessonspace-session-webhook` logs an invocation and updates `lessons.status`.
  - `lessonspace-transcript-webhook` logs an invocation and writes `transcription_status = 'completed'` with a non-null `transcript_size_bytes`.
  - `lessonspace-recording-webhook` logs an invocation and populates `lesson_space_recording_url`.
- Confirm signature verification passes (no `signature mismatch` warnings in logs).

### 4. Keep the fallback, tighten its role
- Leave `hourly-lesson-processing` in place strictly as a safety net for missed webhooks, with its existing "only touch lessons ended > 3h ago" guard.

## Out of scope
- No backfill of historical `processing` rows — those stay on the polling path.
- No changes to summary/insight generation; both paths already fan out to `generate-lesson-summaries`.
