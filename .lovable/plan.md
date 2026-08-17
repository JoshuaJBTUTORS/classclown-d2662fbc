# Test the session-matching fix

Goal: prove the new "pick the right LessonSpace session" logic works on real lessons, not just the one case we already checked.

## What we already know

- The 15 Aug KS2 Maths lesson (Hajra / Lyba Samar) now resolves to the correct session `53e6a4a3…` after the fix, instead of the 36-second solo session.
- A fresh look at the last 4 days shows two problems still visible in the data:
  - Two different lessons on 16 Aug 14:00 (`GCSE Science/ Math 1-1` and `GCSE English Group`) are both bound to the **same** session `eb064f1a…` — exactly the room-reuse symptom the fix targets.
  - Several 16 Aug lessons sit at `transcription_status = available` with `last_poll_error = "Transcript not ready at LessonSpace"` and 6+ poll attempts.

## Test plan

1. **Dry-run selection on recent lessons**
   Run `find-lesson-sessions` with `force: true` over the attended lessons from 15–17 Aug and record, per lesson, which session it picks, the participant count it saw, and the session start time.

2. **Check each pick against three rules**
   - The chosen session overlaps the lesson's own time window (not a session from another day).
   - The chosen session has more than one person in `profiles`/`guests`.
   - No two lessons end up sharing the same session id.

3. **Re-test the known-bad pair**
   Re-run selection for the two 16 Aug 14:00 lessons that currently share `eb064f1a…` and confirm they separate onto two distinct sessions (or that one legitimately has no session).

4. **Test the self-heal path**
   Trigger `hourly-lesson-processing` for the lessons stuck on "Transcript not ready" and confirm from the logs that it re-selects a session on failure and retries, rather than only incrementing the retry counter.

5. **Report**
   A short table: lesson, old session, new session, participants, verdict (fixed / unchanged / no session available).

## Notes

- Steps 1, 3 and 4 write to the database (they update `lesson_space_session_id` and the transcript rows) — that is the intended repair as well as the test.
- No frontend changes are involved.
