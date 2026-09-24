# Homework reminders: one combined message per parent

## Goal
When one parent has two or more children behind on homework, send a single WhatsApp and a single email naming all the children who are behind, instead of one message per child.

## Changes

### 1. `supabase/functions/homework-nudge-reminders/index.ts`
- After computing each student's homework state (current week / last week outstanding), group the students who need a nudge by their parent contact (parent_id, falling back to the student's own email/phone when there is no parent).
- For each parent group, build one message listing the children:
  - One child: keep the current wording exactly as it is today.
  - Multiple children: combine names, e.g. "Oscar and Aarij" / "Oscar, Aarij and Destiny", with wording adjusted to plural, e.g.:
    - Friday current week: "Hello. This is just a reminder that Oscar and Aarij's homework is due today. Please let us know if you are having difficulty completing this week's homework."
    - Friday both weeks: "Hello. This is a reminder that Oscar and Aarij have not yet completed this week and last week's homework. Please note that failure to complete homework can result in restricted access as this is a requirement to ensure we can best support them."
    - Wednesday equivalents adjusted the same way.
  - If children in the same family are in different states (e.g. one is only behind on this week, the other is behind on both weeks), use the more serious variant for the combined message.
- Send one WhatsApp and one email per parent (including secondary contacts, as today).
- Update the "already sent today" dedupe key so it is per parent per day (not per student), so the combined message is only sent once even if the function re-runs.
- Keep the existing `dry_run`, `as_of`, `student_ids`, and `force` options working; dry run output will show the grouped messages.

### 2. Unlinked-student report
- Run a read-only query listing active students with lessons who are NOT linked to any HeyCleo account (no own-email match, and no single-child parent-email fallback), and share the list in chat so accounts can be created for them.

## Verification
- Dry-run the function for the next Wednesday and Friday dates and confirm: families with two children behind produce exactly one message naming both children; single-child families are unchanged.
- Deploy the updated function.
