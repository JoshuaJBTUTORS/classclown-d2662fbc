# Fix Teacher view width and cut-off columns on /calendar

## What is wrong now

The teacher view grid is built from fixed pixel columns: a `w-48` tutor column plus `w-32` per day (`w-24` per hour in day view). In week view that is about 1088px total, so on a wide desktop the grid stops short and leaves empty space on the right.

On smaller screens the opposite happens: the grid is wider than the screen, and the horizontal scroll container is nested inside a `ScrollArea` and flex wrappers that have no `min-w-0`, so the overflow is clipped instead of scrollable. That is why Fri/Sat/Sun are cut off on iPad and everything past Tuesday is cut off on phone.

## Changes (presentation only)

1. **Desktop fills the width** — in week view, day columns become flexible (`flex-1` with a sensible minimum) so seven days share all available space instead of stopping at a fixed 896px. Day view keeps fixed hour columns since 13 hours genuinely need scrolling.
2. **Tablet/phone scroll properly** — fix the overflow chain in `TeacherCalendarView.tsx`:
   - add `min-w-0` / `w-full` to the wrappers between the page `main` and the scroll container so the container can actually be narrower than its content,
   - make the single horizontal scroll container the only scroll owner (header row and tutor rows scroll together), with vertical scrolling handled inside it rather than by a nested `ScrollArea` that blocks horizontal overflow,
   - set the grid's inner track to `w-max` in week view below the desktop breakpoint so columns keep their readable minimum and scroll instead of being clipped.
3. **Tutor column stays visible** — make the `w-48` tutor cell sticky to the left (narrower on mobile) so you always know whose row you are scrolling.
4. Header time-slot cells and `TutorRow` slot cells use the same column sizing rules so header and body stay aligned.

## Files

- `src/components/calendar/TeacherCalendarView.tsx` — wrapper sizing, scroll container, header column classes, sticky tutor header cell.
- `src/components/calendar/TutorRow.tsx` — matching column classes and sticky tutor cell.
- Possibly `src/pages/Calendar.tsx` — add `min-w-0` on the teacher `TabsContent`/`main` chain if needed for the overflow to resolve.

No changes to data fetching, availability logic, event click handling, or dialogs.

## Verification

Screenshot the teacher view at desktop (1440), iPad (820) and phone (392) widths and confirm: no right-hand whitespace on desktop, and all seven days reachable by horizontal scroll on iPad and phone with the tutor column pinned.
