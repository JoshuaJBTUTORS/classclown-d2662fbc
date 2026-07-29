## Goal

Give Agent Cleo one write capability — creating lessons — behind an explicit human approval step. Everything else stays strictly read-only.

## How it will work

1. You ask, e.g. "book a GCSE Maths lesson with Ben for Aisha next Tuesday 5pm, weekly for 12 weeks".
2. The agent uses its existing read tools to resolve the tutor, the student(s) and the subject. If anything is ambiguous or missing (no tutor named, two students with the same name, no time given), it asks you in chat instead of guessing — it never invents an ID.
3. Once it has everything, it does NOT write. It emits a **proposal**: a confirmation card in the chat showing title, subject, tutor, student(s), date/time (Europe/London), duration, group flag, and — if recurring — the weekly pattern and how many occurrences will be generated.
4. The card has **Confirm** and **Cancel** buttons. Nothing is written to the database until you press Confirm.
5. On Confirm, the lesson (and, if recurring, the parent series plus its occurrences) is created, and the agent replies with a link/summary of what was made.

## Access

Lesson creation is restricted to **owner and admin** accounts. The agent's JWT is checked server-side against `user_roles`; anyone else asking to create a lesson gets a polite refusal, and the confirm endpoint rejects them even if called directly.

## Technical details

- **New tool `propose_lesson`** added to `supabase/functions/agent-cleo/index.ts`. It performs no writes — it validates the arguments (tutor exists, student IDs exist, times parse, end after start) and streams a `proposal` event to the UI containing a normalised payload. Validation failures come back to the model so it can ask you a follow-up question.
- **New edge function `agent-cleo-create-lesson`** handles the Confirm press. It:
  - verifies the caller's JWT and owner/admin role via `has_role`,
  - re-validates the payload with Zod (never trusts the client-sent proposal blindly — re-checks tutor/student existence and time sanity),
  - inserts the lesson using the typed Supabase client (no raw SQL), matching the shape the calendar already uses: `lessons` row + `lesson_students` links, `is_group` set from student count or explicit flag,
  - for recurring: creates the parent lesson with `is_recurring`, `recurrence_interval`, `recurrence_day`, `recurrence_end_date` and generates child occurrences with `parent_lesson_id`, following the existing Europe/London offset handling so DST doesn't shift times,
  - returns the created lesson IDs.
- **UI in `src/pages/AgentCleo.tsx`**: a `LessonProposalCard` component rendered inline in the message stream, with details, Confirm/Cancel, pending state, and success/error feedback. Cancelled or confirmed cards lock so they can't be double-submitted.
- `agent_cleo_exec` and the read-only role are untouched — the agent still cannot write through SQL. The only write path is the separate, role-gated, schema-validated function.
- System prompt updated: describes the create capability, requires resolving real IDs first, forbids claiming a lesson exists before you confirm, and instructs it to ask for missing details.

## Not included

No editing, cancelling, or deleting of lessons — creation only.
