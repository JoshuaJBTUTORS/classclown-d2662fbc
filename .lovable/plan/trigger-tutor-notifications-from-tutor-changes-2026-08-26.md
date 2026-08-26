# Trigger tutor notifications from tutor changes

Tutor schedule notifications will be event driven. There will be no job polling every 10 minutes.

## How it works

1. A future lesson is created, reassigned, cancelled, or deleted and the existing database trigger records the tutor addition or removal.
2. That same change resets a delayed notification job for the affected tutor to 30 minutes from the latest change.
3. If another change happens during those 30 minutes, the previous delayed job is replaced and the countdown starts again.
4. After 30 quiet minutes, the tutor receives one generic email summarising the number of sessions added and removed. Processed queue entries are marked sent so they cannot be sent twice.

This means nothing runs repeatedly when tutor schedules are unchanged.

## Technical details

- Replace the proposed shared `*/10` cron with one temporary, uniquely named delayed job per affected tutor.
- Extend the existing `queue_tutor_schedule_change()` trigger function so each queued tutor change cancels that tutor's previous pending job and schedules a replacement for 30 minutes later.
- Update `send-tutor-schedule-notification` to accept and validate a specific `tutorId`, process only that tutor's mature unsent rows, and leave newer rows untouched if a race occurs.
- Make each temporary job remove itself after invocation, whether the email sends or there is nothing left to process.
- Keep the existing generic email template and existing rules for future lessons, additions, removals, reassignments, cancellations, and deletions.

## Verification

- Confirm there is no repeating `tutor-schedule-notifications` cron job.
- Queue a safe test tutor change and verify exactly one temporary job is created.
- Queue a second change for the same tutor and verify the first job is replaced rather than duplicated.
- Test the edge function in dry run mode and confirm only the specified tutor's queued changes are selected.
