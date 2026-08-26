# Verify the tutor schedule notification delivery

## What I found

The original lesson creation was skipped because its start time was already 28 seconds in the past when it was saved. However, moving it to 13:00 UTC and changing the tutor at 11:58 UTC did trigger the notification system correctly.

Checks made:

- A `removed` notification is queued for Joshua Ekundayo.
- An `added` notification is queued for Britney Lawrence.
- The trigger `trg_queue_tutor_schedule_change` is present and enabled on lessons.
- Two active one-off jobs were created, one for each tutor, scheduled for 12:29 UTC (1:29 PM London).
- There is no leftover repeating cron job for tutor notifications, only the unrelated punctuality monitor.

Nothing has been emailed yet because the required 30-minute quiet period has not elapsed. The current state is correct.

## Verification

1. Allow the scheduled jobs to run at 12:29 UTC (1:29 PM London).
2. Confirm both queue rows receive a `sent_at` timestamp.
3. Confirm the temporary jobs remove themselves after invoking the edge function.
4. Check the edge-function logs and email delivery result if either row remains unsent.

## Technical details

- No code or database change is currently required.
- Queue time: `2026-08-26 11:58:57 UTC`.
- Scheduled send time: `2026-08-26 12:29 UTC`.
- The one-minute scheduling buffer prevents the job running slightly before the full 30-minute cooldown has elapsed.
