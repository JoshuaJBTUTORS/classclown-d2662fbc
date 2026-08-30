# Redesign /time-off (tutor view) to the ClassClown design language

Visual-only redesign of the tutor-facing time off page (`src/pages/TimeOff.tsx`). No changes to queries, the create mutation, the 6-day notice validation, timezone handling, role gating, or any button behaviour.

## What changes

### Page shell
- Replace `bg-gray-50` and `container mx-auto` with the app background token and a full-width shell (`min-w-0 w-full flex-1`), matching the fix already applied to `/staff`, `/tutors` and `/time-off-requests`, so no white space is left to the right.
- Header: Plus Jakarta Sans extrabold "Time Off Requests" with a doodle clock accent; drop the grey subtitle.
- "New Request" becomes a black pill button with a plus icon (same toggle behaviour).

### Request form (shown when New Request is toggled)
- Pastel butter surface with `rounded-[1.5rem]`, soft shadow, no harsh borders.
- Notice banner restyled as a pastel inset with a doodle alert icon; copy unchanged.
- Date/time inputs and the reason textarea become outlined rounded pill/soft controls with uppercase labels.
- Footer: Cancel = white outlined pill, Submit Request = solid black pill (same disabled/pending states and labels).

### Requests list
- Card becomes a soft rounded surface with a "Your Time Off Requests" heading and a count pill.
- Each request becomes a white `rounded-2xl` outlined row: date range with a calendar doodle, reason text, pastel status chip (pending = butter, approved = mint, denied = blush, replacing the raw green/red/yellow badges), and a muted "Requested on … • Reviewed on …" footer line.
- Admin notes become a muted pastel inset block.
- Empty and loading states restyled with a doodle icon and friendly copy (same meaning).

### Notice dialog
- Restyled with the existing scoped `cc-dialog` pattern: rounded surface, blush accent, black pill "I Understand". Same trigger conditions and text.

## What does NOT change
- Data fetching, the insert mutation, UK/UTC conversion helpers, the 6-day minimum notice rule and its dialog trigger, tutor-only access gate, sidebar/mobile menu wiring, toasts.

## Technical notes
- Reuse `pastelPalette.ts` tones, `DoodleIcons.tsx`, and the row/chip patterns from `TimeOffRequests.tsx` and `StudentsList.tsx`.
- Verify with `tsgo --noEmit` and check `/tmp/observability/build-errors.log`.
