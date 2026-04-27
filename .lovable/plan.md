## Approach: work backwards from the homework, not from email

You're right — the homework is already linked to a lesson, and the lesson already has its students attached, and each student is linked to their parent. We have all the contact info we need without trying to match the payload's `student_email` (which is actually the Learning Hub login email — often the parent's).

I verified this with the actual failing payloads. For "Density" (Monica Nwankwo's payload), the homework lookup returns **3 enrolled students** with all their parent emails/phones populated. Same for the other 3 failing payloads — every one has full parent contact data reachable via the lesson.

## New webhook flow

In `supabase/functions/heycleo-homework-webhook/index.ts`, replace the current student-by-email lookup with this:

1. **Find the homework by title.** HeyCleo sends `homework_title`. Look up the most recent matching `homework` row:
   ```
   homework where title ILIKE payload.homework_title
   order by created_at desc limit 1
   ```
   If multiple titles match, prefer the one whose lesson is on or just before today (overdue means the lesson already passed).

2. **Load the full enrolment chain in one query:**
   ```
   homework -> lessons -> lesson_students -> students -> parents
   ```
   Returns every student on that lesson, plus their parent's email/phone/name.

3. **Pick the right student** using the payload's `student_email` / `student_name`:
   - If `student_email` matches a `students.email` OR a `parents.email` in the result set → use that student.
   - Else if `student_name` matches a student's `first_name + last_name` (case-insensitive) → use that student.
   - Else if the lesson has only one student → use that student.
   - Else: log a warning, fall back to notifying **every** parent on the lesson (safer than dropping the reminder entirely) and tag the notification metadata as `ambiguous_match: true` so an admin can review.

4. **Send notifications** to that student's contacts (unchanged from current logic):
   - Student WhatsApp / email if `students.phone` / `students.email` exist
   - Parent WhatsApp / email if `parents.phone` / `parents.email` exist

5. **Fallback** — if no homework row matches the title at all, still try the old email-based lookup (now using `.maybeSingle()` against both `students` and `parents`) so we don't regress on edge cases.

## Code changes

Single file: `supabase/functions/heycleo-homework-webhook/index.ts`

Replace lines ~268–300 (the `students` lookup + parent lookup) with the new homework-first resolution. Everything below it (WhatsApp / email send blocks) stays the same — they already handle "parent only" or "student only" correctly because each is guarded by `if (student.phone)`, `if (parent?.email)`, etc.

Also small cleanups while we're in there:
- Switch all `.single()` calls to `.maybeSingle()` so missing rows don't log as `PGRST116` errors
- Add clearer console logs at each resolution step (`"Resolved via lesson enrolment"`, `"Resolved via parent email"`, etc.)

## Verification after deploy

1. Replay one of the failing payloads (e.g. Monica Nwankwo / Density) via `supabase--curl_edge_functions`
2. Check the logs show `Resolved via lesson enrolment -> Justice Okereke` and `notifications_sent.parent_email = true`
3. Confirm a row appears in the `notifications` table with `type = 'homework_overdue'`

No DB schema changes, no migrations — just an edge-function rewrite of the lookup.
