## Step 1 (continued): All lesson deletion paths — audit

Here's every place a lesson row can be removed today, and whether it correctly records a `recurring_lesson_cancellations` entry so `extend_recurring_lessons` doesn't resurrect it.

### 1. Calendar → Lesson Details → Delete (the main UI)

**Component:** `src/components/calendar/LessonDetailsDialog.tsx` → opens `src/components/lessons/DeleteLessonDialog.tsx` → calls `lessonDeletionService`.

Three scopes exposed to the user:

| Scope | Service method | Records cancellation? |
|---|---|---|
| "Delete this lesson only" | `deleteSingleLesson` | Yes — inserts a `cancelled_date` row if the lesson has a `parent_lesson_id` |
| "Delete this and all future" | `deleteFromDateOnwards` | Yes — inserts a `cancelled_from` row and caps `recurring_lesson_groups.instances_generated_until` |
| "Delete all in series" | `deleteAllRecurringLessons` | **No cancellation row.** Deletes the `recurring_lesson_groups` row instead (extender skips series it can't find). This works only as long as the group row is actually removed. |

Edge case in `deleteSingleLesson`: if the row being deleted is the **parent** of the series (`is_recurring = true`, no `parent_lesson_id`), no cancellation is written and the group is left intact — the extender will keep generating children off a now-missing parent (the extender does `SELECT * FROM lessons WHERE id = original_lesson_id` and bails if missing, so this happens to be safe today, but it's fragile).

### 2. Admin → Recurring Lessons → "Delete series" button

**File:** `src/pages/admin/RecurringLessons.tsx:117-132` (`deleteSeries`).

Does a raw `from('lessons').delete().in('id', ids)`, then deletes the `recurring_lesson_groups` row and clears cancellations. Bypasses `lessonDeletionService` entirely — no cleanup of `homework`, `homework_submissions`, `lesson_attendance`, `lesson_students`, `trial_bookings`, no Google Calendar sync. Because it also deletes the group row, the extender won't resurrect anything, but orphaned child data is left behind.

### 3. Trial lesson creation rollback

**File:** `src/services/trialLessonService.ts:158`.

`from('lessons').delete().eq('id', lessonData.id)` runs only when linking a student to a just-created trial lesson fails. It's a rollback on a lesson that never had a parent/series — safe, no cancellation needed.

### 4. Edge functions

`rg` across `supabase/functions` shows no edge function performs `DELETE FROM lessons`. `google-calendar-sync`, `send-lesson-reminder`, and `run-migrations` only match on the words, not on delete operations.

### 5. Cascade / DB-level deletes

No `ON DELETE CASCADE` or trigger currently removes lesson rows automatically. Deletion only ever happens from the three code paths above.

---

### Summary — what's actually broken

- **Path 1 "this only"** and **"from date onwards"** — correct.
- **Path 1 "all in series"** — relies on deleting the group row; no cancellation trail; fragile if the group row is missing.
- **Path 1 when deleting the parent lesson via "this only"** — no cancellation written; extender is coincidentally safe today.
- **Path 2 (Admin Recurring Lessons "Delete series")** — bypasses the service, leaves orphan homework/attendance/student links, no Google Calendar sync.
- **Path 3 (trial rollback)** — fine.
- **No edge-function or DB-cascade deletes exist.**

The gap that likely explains Aizah Noor's re-appearing lessons: if her series was deleted via **Path 2** but the `recurring_lesson_groups` row somehow persisted (or was recreated), the extender would happily regenerate instances — and no cancellation history exists to stop it. For Alicia Babirye, only one "from date onwards" cancellation exists, so any earlier instances deleted via "this only" that weren't captured, or single-lesson deletes on the parent, would be regenerated.

No files were modified in this step. Ready to move to **step 2 (unify all delete paths through `lessonDeletionService` and always write to `recurring_lesson_cancellations`)** and/or **step 3 (add a `BEFORE DELETE` trigger on `lessons` that auto-inserts the cancellation)** whenever you say go.