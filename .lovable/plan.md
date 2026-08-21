# Fix: onboarding doesn't attach the child or move them from trial to active

## What actually happened with Glory Anthony

Checked the live data:

- Proposal `Glory Anthony / gloryenorgieanthony@gmail.com` is `completed` and already linked to a parent user.
- The parent **was** created: `parents` row exists (Glory Anthony, gloryenorgieanthony@gmail.com), created 21 Aug.
- The child exists as a trial student: student id 918, "Glory Anthony", email **gloryirhene2015@gmail.com**, `parent_id = null`, `status = trial`.

So the parent side worked. The child never attached because the onboarding function only finds students whose **email exactly matches the parent's email** (or who already sit under a duplicate parent row with that email). The trial was booked with a different email (`gloryirhene2015@gmail.com`, though the phone `+447857290548` matches the proposal phone), so:

- 0 students linked
- 0 students activated
- nothing ever moves from trial to active

This affects every client whose trial was booked under a different email address than the one on the proposal — it is not specific to this record.

## What to build

### 1. Add a "Link child" section to Step 1 of onboarding

After the proposal is chosen (before/at the point of creating the parent account):

- Show suggested existing students, matched by, in order: same email, **same normalised phone number**, similar name. Each suggestion shows name, email, phone, current status, so the admin can confirm it is the right child.
- Allow searching all students by name/email/phone if no suggestion fits.
- Allow creating a brand-new child (first name, last name, optional email/phone) when no student record exists.
- Multi-select, so siblings can be attached in one go.
- Attaching is required to finish Step 1 unless the admin explicitly ticks "no child record yet".

### 2. Pass the chosen children to the backend

`create-parent-account` gains an optional `student_ids` list and an optional `new_students` list:

- `student_ids`: set `parent_id` to the new parent row, then activate them.
- `new_students`: insert into `students` with `parent_id` set and `status = 'active'`, `account_type = 'regular'`.
- Keep the existing email-based matching as an extra safety net, and add phone matching (digits-only comparison, ignoring spaces and `+44` vs `0` prefixes).
- Activation rule stays the same: students on `trial` or blank status become `active`, and `trial_status` is cleared.
- Response reports linked / created / activated counts so the UI can surface exactly what happened.

### 3. Make failures visible

Currently a run that links nothing still shows a green "Parent account created" toast. Change Step 1 to show a clear warning line when `linkedStudents + createdStudents === 0`, telling the admin no child was attached and to attach one before scheduling lessons.

### 4. Repair the Glory Anthony record

One-off data fix as part of this work: link student 918 to the Glory Anthony parent row and set status `active`, `account_type` `regular`.

## Technical notes

- Files: `src/pages/Onboarding.tsx` (Step 1 UI + payload), `supabase/functions/create-parent-account/index.ts` (student_ids / new_students handling, phone matching, richer response).
- Phone normalisation: strip non-digits, drop leading `44`/`0`, compare last 10 digits.
- Step 3's "check lessons" already queries students by `parent_id`, so it starts working once the child is attached.
