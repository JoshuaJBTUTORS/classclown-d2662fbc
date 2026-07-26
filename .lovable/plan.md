# Assessment Week button on lesson dialog

Add a new action inside the lesson details popup (opened from the calendar) that converts the lesson into an "assessment week" lesson: reassigned to a chosen tutor, using a shared LessonSpace room.

## UX

In `src/components/calendar/LessonDetailsDialog.tsx`, add an amber "Assessment Week" button near the top of the dialog (in the header area next to the title/badges), visible to admin/owner only.

Flow when clicked:
1. Opens a small sub-dialog "Assign Assessment Week".
2. Shows a searchable select of active tutors (loaded from `tutors` joined with `profiles` for names, same pattern used elsewhere in the app).
3. Admin picks a tutor → clicks "Confirm".
4. A confirmation line reminds them time conflicts will be ignored.
5. On confirm: update the lesson, close both dialogs, toast success, call `onLessonUpdated()` so the calendar refreshes.

## Data changes

Single `UPDATE` on `public.lessons` for the current `lesson.id`:
- `tutor_id` = selected tutor id (no conflict/availability checks)
- `lesson_space_room_url` = `https://www.thelessonspace.com/space/2670b244-b11f-4be3-8336-32bb2ce558e9`
- `lesson_space_space_id` = `2670b244-b11f-4be3-8336-32bb2ce558e9`
- `lesson_space_room_id` = `2670b244-b11f-4be3-8336-32bb2ce558e9`
- `video_conference_link` = same URL, `video_conference_provider` = `lessonspace`

No changes to students, homework, attendance, or recurrence rules.

## Recurring lessons

The dialog receives a single `lessonId` (the parent row for recurring series). The update targets that row, so for a recurring series every instance will inherit the new tutor and room — matching how other edits from this dialog behave today. No per-instance override.

## Files touched

- `src/components/calendar/LessonDetailsDialog.tsx` — new button, sub-dialog, tutor list query, update mutation.
- No new edge functions, no schema migration, no other files.
