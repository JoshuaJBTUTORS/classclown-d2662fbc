# Fix HeyCleo homework not showing on the calendar

## What's happening

The calendar chip only appears when a CRM student can be matched to a HeyCleo account. Today matching is email-only:

1. CRM student email matches a HeyCleo account email, or
2. the student's parent email matches — but **only if that parent has exactly one child in the CRM**.

Rizwana Arshad is a real example. Her HeyCleo account is registered under the parent email `arshad57@hotmail.co.uk`, and that parent has two CRM children (Emaan and Inayah), neither of whom has their own email. Rule 2 refuses to guess which child owns the account, so both children show nothing on the calendar.

181 active CRM students are blocked this way.

## The fix

Drop the single-child restriction. When a parent email matches a HeyCleo account, link **every** child of that parent to that account. Siblings in the same family then all show the same family homework status on the calendar.

Resolution order becomes:

1. CRM student email matches a HeyCleo account email.
2. Otherwise, parent email matches a HeyCleo account — link it to all of that parent's children.

Nothing else changes: the chip, the summary line ("X of Y completed last week's homework") and the homework side panel all behave exactly as they do now, just for more students.

## Technical notes

- `src/hooks/useHeyCleoHomeworkStatus.ts`: remove the `siblingCount` lookup and the `=== 1` guard so the parent-email match applies unconditionally; the sibling query can be dropped entirely.
- `src/hooks/useHeyCleoStudentHomework.ts`: apply the same relaxation so the side panel opens for these students too.
- No database change, no change to the HeyCleo pull job or the homework nudge job.
