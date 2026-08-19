# Catch students who are in a room on their own

## What actually happened with Edward Ciopec

Pulled the live LessonSpace data for his GCSE Chemistry room (`41eec470…`, lesson 18:00–19:00 London):

- 17:03–17:12 London: Edward joined the room **twice, completely alone** (two short sessions, no tutor, no other student). Both sessions idled out and closed.
- 18:00: a new session opened with Dionne, then Rutva (tutor).

So he really was alone for ~9 minutes, and nothing in the tracker or the alerting saw it. Three separate reasons:

1. **The tracker only reads the one open session.** `lessonspace-live-participants` takes the session with no `end_time` and lists only `connected_users`. Edward's solo sessions had already ended, so they vanished from the page entirely.
2. **He was too early to be matched to a lesson.** The tracker only looks at lessons starting within the next 10 minutes; the punctuality monitor only looks at lessons that have *already started*. Edward arrived ~57 minutes before his lesson, so neither job even considered that room.
3. **No join/leave webhooks are landing.** In the last 6 hours `lesson_participant_events` only contains `session.start` / `session.end` rows — zero `user.joined` / `user.left`. The event feed can't fill the gap left by 1 and 2.

## What to change

### 1. Show early and recently-closed solo sessions
In `lessonspace-live-participants`:
- Widen the lesson window to lessons starting within the next 60 minutes (still ending no more than 15 minutes ago).
- Instead of only the open session, look at every session for the room that overlaps the last 60 minutes. Keep the open one as "live"; surface closed ones as a "recent activity" entry so a room that a student sat in alone and left still appears.
- Derive attendance from the join/leave **logs**, not just `connected_users`, so people who came and went are listed with their stints.

### 2. Alert on students waiting before the lesson starts
In `tutor-punctuality-monitor`:
- Include lessons starting within the next 30 minutes (currently only `start_time <= now`).
- Keep the existing 5-minute unattended threshold, but count waiting time from the student's first join even when that is before the scheduled start.
- Wording of the alert email gains the scheduled start so ops can see "waiting 9 min, lesson starts in 50 min".

### 3. Fix the missing join/leave webhooks
- Check the LessonSpace webhook subscription actually includes `user.joined` and `user.left`, and confirm `lessonspace-session-webhook` writes those event types (today only session-level rows exist).
- If the subscription is missing those events, re-register it; if the handler drops them, fix the mapping.

### 4. UI on `/admin/live-sessions`
- New "Was in a room alone recently" panel listing closed solo sessions from the last hour: room/lesson, who was in it, from–to, duration.
- Keep the existing "Students waiting, no tutor" badge, and show it for pre-start waiting too.

## Technical notes

Files: `supabase/functions/lessonspace-live-participants/index.ts`, `supabase/functions/tutor-punctuality-monitor/index.ts`, `supabase/functions/lessonspace-session-webhook/index.ts`, `src/pages/LiveSessions.tsx`. No schema changes needed — `tutor_punctuality.students_waiting_since` / `unattended_alert_sent_at` already exist.
