## Tighten the hourly fallback to a 1-hour window

Right now `hourly-lesson-processing` scans everything that ended between 3 hours ago and 7 days ago on every run. That means the same 7-day backlog gets re-scanned 24 times a day — expensive, slow, and it churns lessons that were already handled or already skipped for good reason.

### Change

In `supabase/functions/hourly-lesson-processing/index.ts`, replace the 7-day lower bound with a 1-hour slice, sitting behind the existing 3-hour "must be finished" buffer:

- `cutoff = now − 3h` (unchanged — upper bound, lesson must have ended ≥3h ago)
- `windowStart = now − 4h` (new — lower bound, only the slice that just crossed the 3h mark)

So each hourly run only touches lessons whose `end_time` falls in `[now−4h, now−3h]`. A lesson finishing at 8pm gets picked up by the 11pm run and nothing else.

Idempotency checks further down (skip if `transcription_status` already set, skip if summary already generated) stay as-is, so a retry on the same slice is still safe.

### Technical notes

- No schema changes.
- Only `supabase/functions/hourly-lesson-processing/index.ts` changes.
- Existing log line (`Processing lessons that ended between X and Y`) already prints the window, nothing else to update.

### Out of scope

- No daily catch-up sweep (per your instruction — will not implement).
- No webhook changes.
- No changes to `find-lesson-sessions`, summary generator, or `failed_room_creations`.
