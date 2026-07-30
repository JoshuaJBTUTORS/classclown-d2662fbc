## Goal
Let Agent Cleo propose edits to existing lessons (not just create new ones). The agent never writes: it shows an edit card, the admin reviews and approves, and the approved edit runs through the *same* code path the calendar edit form uses, so side effects (LessonSpace room/participant URL regeneration, enrollment notifications, recurring-series handling) are identical.

## How the edit is applied
The calendar edit form (`src/components/lessons/EditLessonForm.tsx`) applies changes via `src/services/recurringLessonEditService.ts`:
- `updateSingleRecurringInstance(lessonId, updateData)` — one lesson
- `updateAllFutureLessons(lessonId, updateData, fromDateTime)` — this and all future occurrences

Agent Cleo's confirm handler will call those same functions with the same `updateData` shape (`title, description, subject, tutor_id, start_time, end_time, is_group, selectedStudents`). No duplicated update logic, no new edge function for writes — this is what guarantees "exactly as if edited on the calendar". `/agent-cleo` is already behind `ProtectedRoute`, and lesson RLS is the same as for the calendar form.

## Agent side (`supabase/functions/agent-cleo/index.ts`)
- Add a `propose_lesson_edit` tool alongside `propose_lesson`:
  - `lesson_id` (uuid, required, must be resolved by querying `lessons`)
  - optional changed fields only: `title`, `description`, `subject`, `tutor_id`, `start_time`, `end_time`, `is_group`, `student_ids`
  - `scope`: `this_lesson_only` | `all_future_lessons`
- Add a `buildLessonEditProposal()` validator mirroring `buildLessonProposal()`: verify the lesson exists (fetch its current values), verify tutor uuid and student ids exist, validate times (`end > start`, ISO UTC), determine whether the lesson is recurring (`is_recurring` / `is_recurring_instance`) and how many occurrences the chosen scope affects, and build a **before → after diff** of only the fields that actually change.
- Stream this as a new SSE event `{ type: 'edit_proposal', proposal }` and return the same "awaiting_user_confirmation" tool result so the model never claims the edit happened.
- System prompt additions: how to resolve `lesson_id` first, must ask before assuming scope on a recurring lesson, Europe/London → UTC conversion, never state the lesson is changed.

## UI (`src/pages/AgentCleo.tsx`)
- New `EditProposalCard` in the same dark card style as the existing proposal card, showing: lesson title/date, a "Current → Proposed" row per changed field (tutor and student names resolved server-side, times formatted in London), the recurring scope with affected-lesson count, and warning lines when a change triggers side effects (tutor change → room and participant links regenerated; student change → enrollment notifications sent).
- Buttons: **Confirm and apply** / Cancel, with pending → applying → applied/failed states like today.
- On confirm, call `updateAllFutureLessons` or `updateSingleRecurringInstance` from `recurringLessonEditService` and show the count of lessons updated in the card result.

## Out of scope
Cancelling/deleting lessons stays out of this change — say the word and it can be added as a separate proposal type later.
