# Optimise the lesson details dialog for phone view

On mobile, the lesson dialog (opened by tapping a lesson on the calendar) overflows: the "Host Access" chip, "Mark Attendance" button, "Delete Lesson" and "Submit Resources" buttons are cut off at the right edge, as in the screenshot. Visual/layout-only fix — no buttons, handlers, or logic change.

## Root causes

- `DialogContent` is `max-w-2xl` with no explicit mobile width and `p-6` padding everywhere, so content rows sit close to the viewport edge.
- Header rows (`flex items-center ... ml-auto` chips), student attendance rows (`flex items-center justify-between` with non-wrapping action buttons), and the footer action row don't stack on small screens, so buttons get pushed off-screen.
- Long Room ID / Space ID strings can't wrap.

## Changes

1. **`LessonDetailsDialog.tsx`**
   - `DialogContent`: add `w-[calc(100vw-1.5rem)] sm:w-full`, `overflow-x-hidden`, and `p-4 sm:p-6`.
   - Section cards: `p-6` → `p-4 sm:p-6`.
   - Dialog title row and "Video Conference" header row: allow wrapping (`flex-wrap`) so the "Year 11 Maths Higher" / "Host Access" chips drop below the title instead of clipping.
   - Footer action row (Edit / Delete / Submit Resources / Process / Send Proposal): on mobile stack as full-width buttons (`flex-col sm:flex-row`, each button `w-full sm:w-auto justify-center`), keeping the same order and conditions.

2. **`StudentAttendanceRow.tsx`**
   - Student row: `flex items-center justify-between` → stack on mobile (`flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between`); the attendance action group becomes `flex-wrap w-full sm:w-auto` so "Mark Attendance" / status badges are fully visible.

3. **`VideoConferenceLink.tsx`**
   - Room ID / Space ID / other long identifiers: add `break-all` so they wrap inside the card.
   - Confirm the "New Tab" / "Host Room" button group wraps cleanly (already `flex-wrap`, keep).

4. Also apply the same mobile width/padding treatment to the nested "Assign Assessment Week" `DialogContent` (`w-[calc(100vw-1.5rem)]`, `p-4 sm:p-6`).

## Out of scope

No changes to which buttons render, role conditions, handlers, or any data fetching. Desktop layout stays as it is.
