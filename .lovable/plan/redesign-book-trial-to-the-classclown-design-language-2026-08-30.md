# Redesign /book-trial to the ClassClown design language

Visual-only redesign of the public trial booking flow. No UX changes: same 3 steps, same fields, same validation, same confirmation dialog copy, same submission and redirect to `/trial-booking-confirmation`.

## What changes visually

**Page shell (`src/pages/TrialBooking.tsx`)**
- Soft off-white background with subtle pastel glow, centred content column, generous padding.
- Hero block: Plus Jakarta Sans heading with a hand-drawn squiggle underline, muted subtitle, and (when a referral code is present) a pastel outlined "invited by" chip instead of plain text.
- Rounded outlined card (black border, soft shadow) wrapping the current step content.
- Footer navigation: Previous as an outlined pill, Next / Submit Request as a solid black pill, "Step X of Y" as a muted pill in the middle. Stacked and full-width on mobile.

**Step indicator (`StepIndicator.tsx`)**
- Circles become outlined black-bordered badges: completed = solid black with tick, current = pastel fill with black outline, upcoming = white with muted outline. Connector lines soften to thin neutral rules. Labels uppercase, small, tracked.

**Step 1 – Subject (`SubjectSelectionStep.tsx`)**
- Subject options rendered as pastel outlined selectable cards/pills instead of the current plain control, with a black-outline selected state. Same options and same selection behaviour.

**Step 2 – Date & Time (`DateTimeSelector.tsx`, `TimeSlotSelector.tsx`)**
- Date picker and slot grid on rounded outlined surfaces, time slots as pill buttons with black-outline selected state, softer loading and empty states. Times only (tutor counts stay removed).

**Step 3 – Contact (`ContactInfoStep.tsx`)**
- Inputs get rounded fields with soft borders, uppercase small labels, error text in a muted red pill. Booking summary shown in a pastel outlined recap panel.

**Confirmation dialog**
- Same wording, restyled: rounded dialog, black outline, doodle icon chip, outlined Cancel and solid black Confirm Booking. Mobile-safe scrolling.

## Explicitly unchanged

Form state, `validateStep` rules, phone validation, `handleTimeSelect` tutor/lesson-time logic, `createTrialBooking` payload, referral code handling, toasts, navigation.

## Technical notes

- Files touched: `src/pages/TrialBooking.tsx`, and in `src/components/trialBooking/`: `StepIndicator.tsx`, `SubjectSelectionStep.tsx`, `DateTimeSelector.tsx`, `TimeSlotSelector.tsx`, `ContactInfoStep.tsx`.
- Reuse existing ClassClown tokens/classes already used on `/calendar`, `/students` and `/refer` (pastel surfaces, black outline, Request Topic-style pills, doodle SVG accents). Replace hardcoded `#e94b7f` buttons with the shared pill styling.
- Verify with typecheck/build and a screenshot of the public `/book-trial` route at desktop and mobile widths.
