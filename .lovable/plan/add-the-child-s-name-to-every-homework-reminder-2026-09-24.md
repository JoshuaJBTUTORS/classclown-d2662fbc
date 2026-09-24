# Add the child's name to every homework reminder

## The reminders we send today

Sent by WhatsApp and email on Wednesday 4pm and Friday 9am, only when homework is outstanding. None of them name the child right now.

1. **Wednesday, this week not done**
   "Hello. This is a reminder that your child has X days left to complete this week's homework. Please log on to classclowncrm.com and head to HeyCleo to complete the homework."
2. **Wednesday, last week still not done**
   "Hello. This is a reminder that your child's homework due from last week has not yet been completed. Please note that failure to complete can result in restricted access from future lessons as this is a requirement to ensure we can best support your child."
3. **Friday, due today**
   "Hello. This is just a reminder that your child's homework is due today. Please let us know if you are having difficulty completing this week's homework."
4. **Friday, this week and last week not done**
   "Hello. This is a reminder that your child has not yet completed this week and last week's homework. Please note that failure to complete homework can result in restricted access as this is a requirement to ensure we can best support your child."

The Sunday "Your new homework is ready" message is an announcement, not a reminder, so it stays as it is.

## New wording (child's first name added, rest unchanged)

1. "Hello. This is a reminder that **Amara** has X days left to complete this week's homework. Please log on to classclowncrm.com and head to HeyCleo to complete the homework."
2. "Hello. This is a reminder that **Amara's** homework due from last week has not yet been completed. Please note that failure to complete can result in restricted access from future lessons as this is a requirement to ensure we can best support **Amara**."
3. "Hello. This is just a reminder that **Amara's** homework is due today. Please let us know if you are having difficulty completing this week's homework."
4. "Hello. This is a reminder that **Amara** has not yet completed this week and last week's homework. Please note that failure to complete homework can result in restricted access as this is a requirement to ensure we can best support **Amara**."

If a student has no first name on file, the message falls back to "your child" as today.

## Families with more than one child

Today a family only gets one reminder per day, so if two siblings are both behind, the second child is silently skipped. Now that each message names a child, each child who is behind gets their own reminder, and each child still only gets one per run.

## Technical notes

- `supabase/functions/homework-nudge-reminders/index.ts`: turn the `MSG` entries into functions taking the child's first name (trimmed, fallback "your child", possessive "your child's"), and pass `student.first_name`.
- Change the de-duplication key from `email:<address>` / `whatsapp:<number>` to include the student id, so siblings each get their own message while re-runs still never double send.
- Include the child name in the dry-run output so a test run shows the exact text.
- Redeploy the function, then do a dry run for this Friday to confirm the wording.
