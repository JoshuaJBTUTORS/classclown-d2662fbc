# Fix HeyCleo homework not showing on the calendar

## What's happening

The calendar chip only appears when a CRM student can be matched to a HeyCleo account. Today matching is automatic and email-only:

1. CRM student email matches a HeyCleo account email, or
2. the student's parent email matches — but **only if that parent has exactly one child in the CRM**.

Rizwana Arshad is a real example. Her HeyCleo account is registered under the parent email `arshad57@hotmail.co.uk`, and that parent has two CRM children (Emaan and Inayah), neither of whom has their own email. Rule 2 refuses to guess which child owns the account, so both children fall back to "no data" and nothing shows on the calendar.

This is not a one-off: 181 active CRM students sit in families where the parent email matches a HeyCleo account but there is more than one sibling. Matching on the child's first name only rescues 9 of them, because HeyCleo accounts are usually registered in the parent's name. The remaining families can only be resolved by a human deciding which child (or children) the HeyCleo account belongs to.

## The fix

**1. Store an explicit link**

Add an optional HeyCleo account reference on the CRM student record. When set, it always wins over the automatic email guess.

**2. Widen automatic matching (safe cases only)**

- Keep the direct student-email match.
- Keep the single-child parent-email match.
- Add a child-name match: if the parent email matches a HeyCleo account whose first name equals the child's first name, link it.
- For remaining multi-sibling families, stay unlinked but mark them as "needs linking" instead of silently showing nothing.

**3. Give admins a way to link**

On the HeyCleo data page, add an "Unlinked students" view listing every CRM student in a family whose parent email matches a HeyCleo account but who has no resolved link. Each row has a picker of candidate HeyCleo accounts (family matches first, then a searchable list of all accounts) to set or clear the link.

**4. Surface the state on the calendar**

In the lesson dialog, students that are unlinked show a neutral "Not linked to HeyCleo" chip rather than nothing, so tutors can tell the difference between "no homework data" and "no account connected".

## Technical notes

- Migration: `students.heycleo_student_id uuid` (nullable, indexed) referencing `heycleo_students.student_id`; grants and RLS follow the existing `students` policies. Staff-only writes.
- `src/hooks/useHeyCleoHomeworkStatus.ts`: resolution order becomes explicit link → student email → parent email (single child) → parent email + first-name match; return a `needsLinking` set alongside `statuses`/`links`.
- `src/hooks/useHeyCleoStudents.ts`: extend to expose account first/last name for the picker.
- New `src/components/heycleo/LinkHeyCleoStudentDialog.tsx` plus an "Unlinked" tab in `src/pages/admin/HeyCleoData.tsx`.
- `HomeworkStatusChip.tsx` / `StudentAttendanceRow.tsx`: add the `not_linked` chip state; existing side-panel behaviour unchanged.
- The hourly HeyCleo pull and the homework nudge job are untouched; the nudge job keeps using its own linking rules unless you want it switched to the explicit link too.
