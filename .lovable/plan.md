# Tutor schedule notification did not fire for the lesson just booked

## What I found

The lesson you just created (11:54 UTC today) has a start time of 11:54:00 and was written to the database at 11:54:28, so its start time was already 28 seconds in the past by the time the trigger ran. The trigger only queues a notification when the lesson starts in the future, so it was skipped on purpose.

Checks made:

- The queue table `tutor_schedule_notifications` is completely empty, so nothing was queued and nothing was sent.
- The trigger `trg_queue_tutor_schedule_change` is present and enabled on lessons.
- There is no leftover repeating cron job for tutor notifications, only the unrelated punctuality monitor.

So the plumbing is in place, it simply had no eligible change to act on.

## Proposed fix

1. Loosen the "future lesson" rule to a short grace window so a session created at or just after its start time still counts as a change worth telling the tutor about. Anything already clearly in the past stays silent.
2. Re-run a live end to end test by booking a genuinely future test session for a tutor, then confirming a queue row appears and a single delayed job is scheduled for that tutor.
3. Because the wait is 30 quiet minutes, verify delivery either by waiting out the window or by running the send function directly for that tutor once the window has passed.

## Technical details

- Update `queue_tutor_schedule_change()` so the INSERT, UPDATE and DELETE branches compare against `now() - interval '15 minutes'` instead of `now()`.
- No edge function or frontend changes are needed; `send-tutor-schedule-notification` and the per tutor delayed job logic already work off the queue.
- Verification queries: newest rows in `tutor_schedule_notifications`, and `cron.job` entries named `tutor-schedule-notification-%`.
