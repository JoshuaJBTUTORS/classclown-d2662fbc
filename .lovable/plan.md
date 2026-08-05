# Fix: show first join time, not latest

## Problem

A tutor who joins, drops out, and rejoins (e.g. 18:02 then 18:14) is currently shown as joining at 18:14.

Two places cause this:

- The live participants poller picks the **most recent** `user-joined` log for each person.
- The punctuality monitor takes whichever teacher join log it finds, rather than the earliest one in the session.

## Changes

Scope stays on the **currently active session only** — we just take the earliest join time within that session.

1. Live participants poller
   - For each participant, sort their `user-joined` logs in the active session ascending and take the **earliest** as `joinedAt`.
   - Also return `lastJoinedAt` and a `rejoinCount` so the tracker can still show reconnections.

2. Punctuality monitor
   - Keep using the active session only.
   - Take the earliest teacher `user-joined` log in that session as `tutor_first_join_at`.
   - When a record already exists, overwrite `tutor_first_join_at` if the newly found join is earlier (so an incorrectly-late record self-corrects), and recompute `minutes_late` / `status`.
   - Same earliest-wins rule applied to the webhook `lesson_participant_events` fallback.


3. Live Lesson Tracker UI (`/admin/live-sessions`)
   - Label the time as "First joined" and, where a rejoin happened, add a small "rejoined HH:MM" note.

4. Backfill the lesson happening now by re-running the monitor once the earliest-wins logic is in place.

## Technical notes

- Files: `supabase/functions/lessonspace-live-participants/index.ts`, `supabase/functions/tutor-punctuality-monitor/index.ts`, `src/pages/admin/LiveSessions.tsx`.
- No schema change needed; `tutor_punctuality` already stores `tutor_first_join_at`, `minutes_late`, `status`.
