# Tutor Breach Detection Tool

A daily job scans lesson transcripts for tutor breaches, raises an alert banner inside Agent Cleo for every admin user until each dismisses it, and emails the core team.

## What counts as a breach

Taken from the uploaded policy document:

1. Sharing or requesting personal information (email, phone, address, socials, logins)
2. Rude, abusive, discriminatory, threatening or sexually inappropriate communication
3. Poor conduct / professional misconduct (unsafe, dishonest, disruptive, reputationally damaging)
4. Safeguarding violations (boundary breaches, unauthorised contact, unreported concerns)
5. Discrimination or harassment based on a protected characteristic

## How it works

1. Runs once daily (07:00 UK) and looks at transcripts completed in the last 24 hours that have not already been scanned.
2. Each transcript goes to an AI model with the five breach categories above and returns: breach yes/no, category, severity (low / medium / high), a short summary, and the exact quoted lines that triggered it.
3. Every scanned lesson is recorded so it is never re-scanned or double-reported.
4. Any detected breach is stored with the lesson, tutor, students, category, severity, evidence quotes and a link back to the lesson.
5. Open breaches appear as a red alert card at the top of Agent Cleo for every admin/owner user. Each user dismisses it for themselves; it stays visible to everyone else until they dismiss it too. Clicking through opens the full detail (transcript quotes, tutor, lesson date, students).
6. Admins can mark a breach as reviewed/resolved, which removes it for everyone.
7. If any new breaches were found that day, one summary email goes to joshua@, britney@ and hannah@classbeyondacademy.io listing tutor, lesson, category, severity and the quoted evidence. No breaches, no email.

## Technical details

- New table `tutor_breaches`: lesson_id, tutor_id, transcription_id, category, severity, summary, evidence (jsonb array of quotes), status (`open` / `resolved`), resolved_by/at, created_at. Plus `tutor_breach_dismissals` (breach_id, user_id, dismissed_at) for per-user dismissal. Both admin/owner-only via RLS using `has_role`, with the required GRANTs.
- New table column not needed on `lesson_transcriptions`; scanned state is tracked by a `breach_scan_log` row per transcription (transcription_id unique) so re-runs are idempotent.
- New edge function `daily-breach-scan` (`verify_jwt = false`, service-role client), modelled on `daily-timeoff-clash-check`: bounded batch (max 50 transcripts per run), skips already-scanned rows, continues past individual failures, and sends the Resend summary email with the existing `enquiries@classbeyondacademy.io` sender.
- Detection uses the Lovable AI Gateway with `google/gemini-3.7-flash` and a strict JSON schema response; long transcripts are truncated/chunked to fit. Gateway 402/403 pauses the run and logs it rather than looping.
- Scheduling via `cron.schedule('daily-breach-scan', '0 6 * * *', ...)` with `net.http_post` (06:00 UTC = 07:00 London in summer).
- Frontend: new `BreachAlertBanner` component rendered at the top of `src/pages/AgentCleo.tsx` (and the Daily Snapshot tab), backed by a `useTutorBreaches` hook that loads open, non-dismissed breaches for the current user; dismissal writes a row to `tutor_breach_dismissals`. Styling follows the existing ClassClown design language.
