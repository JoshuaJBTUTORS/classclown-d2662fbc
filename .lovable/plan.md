

## Homework Completion Check Before Setting Homework

### What we're doing

When a tutor clicks "Set Homework", before the homework assignment dialog opens, a quick checkpoint dialog will appear asking: **"Did the following students complete their homework from last session?"** Each student gets a Yes / No / Excused toggle. This gets saved to the database, then the normal AssignHomeworkDialog opens.

### Database

**New table: `homework_completion_status`**

| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| homework_id | uuid FK → homework.id | The previous homework being checked |
| student_id | int FK → students.id | |
| status | text | 'completed', 'not_completed', 'excused' |
| marked_by | uuid FK → auth.users.id | Tutor who marked it |
| created_at | timestamptz | |

RLS: authenticated users with tutor/admin/owner roles can insert/select.

### New component: `HomeworkCompletionCheckDialog`

- Shown when tutor clicks "Set Homework"
- Fetches the **most recent previous homework** for that lesson (by `lesson_id` matching the same recurring group or subject)
- If no previous homework exists, skip straight to AssignHomeworkDialog
- Lists each student with their name and three radio options: **Yes** / **No** / **Excused**
- On submit, saves to `homework_completion_status` table, then opens AssignHomeworkDialog

### Flow change in `LessonDetailsDialog.tsx`

1. "Set Homework" button click → open `HomeworkCompletionCheckDialog` instead of directly opening `AssignHomeworkDialog`
2. After completion check is submitted (or skipped if no previous homework) → open `AssignHomeworkDialog`

### Files

| File | Action |
|------|--------|
| Migration | Create `homework_completion_status` table with RLS |
| `src/components/homework/HomeworkCompletionCheckDialog.tsx` | Create — the checkpoint dialog |
| `src/components/calendar/LessonDetailsDialog.tsx` | Edit — wire up the new dialog before homework assignment |

