# Why last week's lesson summaries failed

## What the data shows (week 3–9 Aug, 106 lessons)

| Outcome | Count |
| --- | --- |
| Transcript completed (incl. the 2 we just recovered) | 80 |
| Stuck at `processing` — no transcript URL ever obtained | 15 |
| Stuck at `available` — URL obtained but text never downloaded, URL now expired | 11 |

Every lesson had a LessonSpace session id, so session discovery is not the problem. The failure is entirely in how the transcript is collected.

## Root cause 1 — the webhook almost never delivers, so everything falls to polling

`transcription.finish` is registered on every space, but only about 5 of last week's 106 lessons produced a transcript row within minutes of the lesson ending. Every other row was created 3+ hours later by the polling job. In practice the webhook is not a working fast path: the system depends on `hourly-lesson-processing`.

## Root cause 2 — the hourly job only looks back 24 hours, and each transcript gets very few attempts

`hourly-lesson-processing` selects lessons that ended between 24h and 3h ago. That gives each lesson a maximum of ~21 polls, but the log shows many lessons were first touched 12–28 hours after they ended (the 14:00 cluster is the *daily* job catching stragglers, not the hourly one). Those lessons got one or two attempts at most, and once the lesson passed the 24-hour boundary it was never looked at again. There is no retry state, no backlog sweep, and nothing that flags a lesson as permanently un-transcribed — it simply goes quiet.

## Root cause 3 — the hourly loop is a single sequential pass that runs out of time

The job loops over every lesson in the window in one invocation with 1–3 second sleeps plus nested function invocations per lesson. Lessons are ordered newest-first, so when the invocation is killed the *oldest* lessons in the window are the ones dropped — exactly the tail-drop pattern we already fixed in the homework sync. This is why lessons kept reappearing a day later via the daily job instead of being handled on the next hour.

## Root cause 4 — a 12-hour URL captured once is never re-downloaded

Polled transcript URLs expire after 12 hours. The job downloads the text on the same pass that discovers the URL; if that single download fails (or the URL is discovered late), the row is left at `available` and, once outside the 24-hour window, is never retried. All 11 `available` rows are dead links now.

## Proposed fixes

1. **Widen and make the sweep stateful.** Replace the fixed 24h window with a work queue: any lesson whose transcript is not `completed` stays eligible for up to 7 days, with per-row `processing_attempts` and exponential back-off, and a terminal `unavailable` state after the ceiling so it is visibly failed rather than silently gone.
2. **Chunk the hourly run with handoff.** Process a fixed slice (e.g. 15 lessons) per invocation, oldest-first, and self-invoke for the remainder before processing the slice — the same pattern that fixed `weekly-homework-sync`.
3. **Re-fetch text on a separate pass.** Treat "URL known" and "text downloaded" as two independent steps, and re-poll LessonSpace for a fresh URL whenever `expires_at` has passed instead of retrying a dead link.
4. **Investigate webhook delivery.** Confirm with LessonSpace whether `transcription.finish` is firing for these spaces (transcription may not be enabled on some room types, or deliveries may be failing signature verification). Add a log row per inbound webhook so delivery rate is measurable rather than inferred.
5. **Surface the failures.** A weekly digest (or an admin view) listing lessons with no transcript/summary, so a silent gap like this is visible within a day instead of at homework-sync time.

## Suggested order

Fixes 2 and 1 first (they stop the ongoing loss), then 3, then 4 and 5.

Backfill of last week's 26 stuck lessons is out of scope here — the URLs have expired, so recovery depends on whether LessonSpace can still re-issue transcripts for those sessions (part of step 4).
