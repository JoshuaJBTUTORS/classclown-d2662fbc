# Lesson-Start Popup for Students & Parents

## Goal
When a student (or parent) is logged in anywhere in the app and it's time for their lesson, show a popup that says "It's time for your lesson — Join below" so they don't have to navigate to the calendar. The popup's Join button takes them straight into the lesson.

## Current state
- Students/parents land on `/progress` and currently must go to `/calendar` to find and click a lesson, then use the join flow at `/join-lesson/:lessonId` (`StudentJoinPage.tsx`).
- `MainLayout.tsx` wraps **all** authenticated routes — a component mounted there appears on every page.
- `useCalendarData.ts` already contains the exact query patterns for fetching a student's lessons (by `students.email` → `lesson_students.student_id`) and a parent's children's lessons (by `parents.email` → children → `.in('lesson_students.student_id', ids)`).

## What to build

### 1. New hook: `src/hooks/useLiveLessonAlert.ts`
Reuses the same student/parent lookup pattern as `useCalendarData.ts`.

- Runs only for `userRole === 'student' || 'parent'`.
- Fetches lessons for today where `start_time <= now + 10min` and `end_time >= now` (i.e. starting soon or already live and not finished), `status = 'approved'` (exclude cancelled).
- Polls every **60 seconds** (plus a one-time immediate fetch on mount and when the user/email resolves).
- Returns `{ activeLesson, dismiss }` where `activeLesson` is the soonest live/starting lesson that hasn't been dismissed this session.
- Dismissed lesson IDs are tracked in `sessionStorage` (`live-lesson-alert-dismissed`) so a dismissed lesson doesn't reappear, but a new lesson later in the day will. Cleared on logout.

### 2. New component: `src/components/lessons/LessonStartPopup.tsx`
Uses the existing `Dialog` (`@/components/ui/dialog`).

- Renders only when `activeLesson` is present.
- Content: lesson title, tutor name, formatted start time, and the message "It's time for your lesson — join below."
- Buttons:
  - **Join Now** → `navigate('/join-lesson/' + lessonId)` and auto-dismiss.
  - **Remind me in 5 min** → dismiss (snooze) — re-arm the popup after 5 minutes via the sessionStorage flag with a re-show timestamp.
  - **Dismiss** → dismiss for this lesson (won't show again this session).
- Styled with the Premium Teal design tokens (no hardcoded colors).

### 3. Mount globally in `MainLayout.tsx`
Add `<LessonStartPopup />` inside the layout so it's present on every authenticated page (calendar, progress, homework, etc.). It self-gates on role, so admins/owners/tutors see nothing.

## Edge cases
- Multiple lessons overlapping: show the soonest starting one; once dismissed, the next one becomes active.
- Lesson already started but not ended: still show ("Your lesson has started — join now").
- Lesson with no `lesson_space_room_id` / classroom: still show the popup; the Join button goes to the join page which handles "classroom not ready" messaging.
- Only `approved` lessons trigger the popup (no cancelled/draft).

## Files changed
- `src/hooks/useLiveLessonAlert.ts` (new)
- `src/components/lessons/LessonStartPopup.tsx` (new)
- `src/components/layout/MainLayout.tsx` (mount the popup)
