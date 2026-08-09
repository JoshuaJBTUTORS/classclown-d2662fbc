# Weekly homework release: automated sync + notifications

Automate the weekly HeyCleo homework push and follow it with a WhatsApp and email announcement to families.

## What happens each week

Every Sunday evening (UK time) a scheduled job runs:

1. Looks at the week that has just finished and finds every student who has a homework brief from their lessons that week.
2. Students with no homework brief that week are skipped entirely — no sync, no message.
3. For each eligible student, sends the weekly homework summary to HeyCleo, waiting 5 seconds between students so we never hit HeyCleo rate limits.
4. Only after a student's sync succeeds, sends them the announcement by WhatsApp and email.
5. Both the parent and the student are contacted where we hold their email and phone number; duplicates (same address/number) are only messaged once.
6. If a sync fails for a student, no message is sent to that family and the failure is logged so it can be retried.

## The message

Same wording for WhatsApp and email:

```text
Hello,

Hope you're well. Your new homework is now ready to complete.

A quick reminder that homework is compulsory and forms part of your ongoing lessons. Homework is released every Monday and should be completed by Friday. If homework remains incomplete for more than 5 days after the deadline, access to future lessons may be temporarily restricted until it has been completed.

Homework should usually take around 20 to 30 minutes to complete. If you would like additional homework, please contact your account manager.

How to access your homework:

Go to ClassClownCRM.com. This is the same site you use to join your lessons.

Click Homework in the menu.

This will open HeyCleo, our learning platform currently being deployed in schools across the UK.

Complete all of the questions on the platform.

Once finished, click Complete Homework.

That's it. Your homework will then be marked as complete.
```

The email uses the standard branded layout and subject line "Your new homework is ready".

## Safety and control

- The job can be run manually for a chosen week, and has a test mode that reports who would be synced and messaged without sending anything.
- A notify-only or sync-only mode so a partial run can be finished without duplicating work.
- Every send is recorded, so re-running the same week will not message the same family twice.

## Technical notes

- Extend `supabase/functions/weekly-homework-sync/index.ts`:
  - Add a 5s delay between per-student HeyCleo POSTs (existing retry/backoff kept).
  - After a successful POST, send notifications via the existing `whatsappService` (`_shared/whatsapp-service.ts`) and Resend from `enquiries@classbeyondacademy.io`, using a new React Email template in `weekly-homework-sync/_templates/`.
  - Recipients: `students.email`/`students.phone` plus the linked `parents.email`/`parents.phone`, de-duplicated and normalised via the shared phone formatter.
  - New body flags: `notify` (default true), `notify_only`, plus existing `dry_run`, `week_start`, `student_ids`.
  - Idempotency: check `notifications` for an existing row of type `weekly_homework_release` with the same week + contact before sending; insert one row per successful send.
- Add a `pg_cron` job `weekly-homework-release` scheduled Sunday 18:00 UTC calling the function via `net.http_post` (created with the data tool, matching existing jobs).
- No schema changes; `notifications` is reused for logging and de-duplication.
