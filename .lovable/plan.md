## Why deleted lessons keep coming back

There are two systems creating lessons in the future:

1. **`lessons` table** — the actual lesson rows you delete from.
2. **`recurring_lesson_groups` + `extend_recurring_lessons()` DB function** (run on a schedule) — looks at the original parent lesson and **re-inserts** future occurrences up to ~3 months ahead. Its only dedup check is `DATE(start_time) + tutor_id + title`, so once your deleted rows are gone, it happily recreates them.

It also ignores per-instance deletions and "delete from date onwards" choices, because nothing tells the extender that those dates were intentionally removed.

## What I'll change

### 1. Record cancellations so the extender respects them
Add a small table `recurring_lesson_cancellations`:
- `parent_lesson_id` (uuid)
- `cancelled_date` (date) — single skipped occurrence
- `cancelled_from` (date, nullable) — "from this date onwards"
- `reason`, `created_by`, `created_at`

When a user deletes:
- **This lesson only** (recurring instance) → insert a `cancelled_date` row.
- **From date onwards** → insert a `cancelled_from` row **and** update `recurring_lesson_groups.is_infinite=false` + set `instances_generated_until` to the day before, so the extender stops past that point.
- **All recurring lessons** → delete the matching `recurring_lesson_groups` row (and the parent lesson) so nothing extends ever again.

### 2. Update `extend_recurring_lessons()`
Before inserting a candidate occurrence, skip it if:
- a `cancelled_date` matches that date, or
- a `cancelled_from` row exists with `cancelled_from <= working_date`, or
- the parent lesson no longer exists, or
- the recurring group's `instances_generated_until` is in the past.

Also stop using `title + tutor + date` as the only dedup — additionally check `parent_lesson_id` so unrelated lessons with the same title don't block creation, and cancellations do.

### 3. Update `lessonDeletionService.ts`
Wire the three delete paths to write the right cancellation row / group update in the same transaction-style flow as the lesson delete.

### 4. New admin view: "Recurring lessons"
A small page at `/admin/recurring-lessons` listing every `recurring_lesson_groups` row with:
- parent lesson title, tutor, students, cadence
- next extension date, last generated date, is_infinite
- buttons: **Extend by 3 months**, **Stop extending**, **Delete series**

This is what you asked for — "how we can check what lessons we should create more instances for". You'll see exactly which series are still auto-extending and which have run out, and choose what to do.

## Files touched

- `supabase/migrations/*` — new `recurring_lesson_cancellations` table + grants + RLS, rewrite `extend_recurring_lessons()`.
- `src/services/lessonDeletionService.ts` — record cancellations on delete.
- `src/pages/admin/RecurringLessons.tsx` (new) + route in `App.tsx` + sidebar link.
- `src/components/admin/RecurringLessonsTable.tsx` (new).

## Not in scope

- Backfilling cancellations for lessons you've already deleted in the past — those parents/series are still extending. After this ships I can run a one-off cleanup against the series you point me at, or the new admin page will let you stop them yourself.