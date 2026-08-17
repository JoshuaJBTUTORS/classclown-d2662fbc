# Alert when students are waiting in a room with no tutor

Today the punctuality monitor only checks whether the tutor joined 5 minutes after the scheduled start. It does not know whether anyone is actually sitting in the room. This adds a "students waiting, no tutor" alert built on the same 5-minute cron and the same Live Lesson Tracker data source.

## Rule

Every 5 minutes, for lessons currently in progress (already covered by the monitor's window):

1. Poll LessonSpace for the live room state (same call the Live Lesson Tracker uses).
2. If at least one non-teacher participant is connected AND no teacher is connected AND the earliest student has been waiting 5+ minutes, raise an alert.
3. Email Hannah and Britney: which lesson, which tutor is expected, how long the student(s) have been waiting alone, and their names.
4. Re-alert at most once every 15 minutes while the situation persists, so a long unattended session escalates but does not spam.
5. Clear the state as soon as a teacher appears in the room.

This is independent of the existing "tutor never joined" alert: it also fires when a tutor joined and then dropped out mid-lesson while students are still there.

## Dashboard

On `/admin/live-sessions`, any lesson currently in the unattended state gets a red "Students waiting, no tutor" badge with the waiting time, and the alert history (last alert sent time) shows on the punctuality card.

## Technical notes

- Extend `supabase/functions/tutor-punctuality-monitor/index.ts` rather than adding a new function (it already runs `*/5 * * * *`, already fetches the lessons in window, already has Resend + LessonSpace credentials).
- Reuse the session-parsing logic from `lessonspace-live-participants`: active session = the one without `end_time`; connected participants from `connected_users` joined to `profiles`; `role === 'teacher'` marks the tutor.
- Waiting time = now minus the earliest `user-joined` log for the connected students in the active session (fallback: session `start_time`).
- Store the state on the existing `tutor_punctuality` row (upsert on `lesson_id`): `status = 'students_unattended'`, plus two new nullable columns via migration — `students_waiting_since timestamptz` and `unattended_alert_sent_at timestamptz` — so the existing `alert_sent_at` (tutor-never-joined alert) keeps its meaning.
- Re-alert throttle: send when `unattended_alert_sent_at` is null or older than 15 minutes.
- When a teacher is connected, clear `students_waiting_since` and let the existing on_time/late logic own the status.
- `src/pages/LiveSessions.tsx`: derive the badge from the live participant payload it already fetches (students present, no leader) so it updates without waiting for the cron, and surface the stored alert timestamp in the punctuality section.
