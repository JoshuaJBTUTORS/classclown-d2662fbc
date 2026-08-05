# Lesson proposal expiry reminders

Send two friendly reminder emails before a lesson proposal's 24 hour window closes: one at 12 hours remaining and one at 1 hour remaining.

## When reminders go out

The proposal countdown already runs for 24 hours from the moment the proposal is created.

- 12 hour reminder: sent once the proposal is roughly 12 hours old
- 1 hour reminder: sent once the proposal is roughly 23 hours old

A reminder is skipped if the proposal has already been agreed, completed, or expired, or if that reminder was already sent. Each reminder is sent at most once per proposal.

## Email content

Plain text style, no emojis, no hyphens, no marketing filler. Subject: "Your lesson proposal is expiring soon".

Body:

```text
Hi [name],

Just a friendly reminder that your lesson proposal from Class Beyond Academy will be expiring soon.

Please note that completing the document does not initiate any charges. You are not charged until after your first lesson.

You can review and complete your proposal here:
[proposal link]

If you have any questions, just reply to this email or call us on 01438 582848.

Class Beyond Academy
```

The 1 hour email uses the same wording with a line noting the proposal expires within the hour.

## Technical notes

1. Migration on `lesson_proposals`: add `reminder_12h_sent_at` and `reminder_1h_sent_at` (timestamptz, nullable).
2. New edge function `send-proposal-expiry-reminders`:
   - Uses the service role client, so it needs no caller auth.
   - Selects proposals with `status` in ('sent', 'viewed') whose `created_at` falls in the 12 hour or 1 hour window and whose matching reminder column is null.
   - Renders the email with React Email in `_templates/proposal-expiry-reminder-email.tsx` and sends it via Resend from `enquiries@classbeyondacademy.io`.
   - Builds the link as `https://classclowncrm.com/proposal/{id}/{access_token}`, matching `send-proposal-email`.
   - Stamps the relevant reminder column after a successful send so it never repeats.
   - Logs and continues on individual failures so one bad address does not stop the batch.
3. Schedule with pg_cron every 15 minutes calling the function through pg_net, following the existing scheduled function pattern.
