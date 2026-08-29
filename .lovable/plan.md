# Redesign /onboarding in the ClassClown design language

Purely visual restyle of `src/pages/Onboarding.tsx`. Every button, label, step, condition, handler, disabled rule and piece of copy stays exactly as it is today — only class names and wrapper markup change.

## Current workflow (unchanged)

```text
Step 1 Parent    -> select completed proposal, Create parent account / Refresh list / Continue
Step 2 Sessions  -> proposal summary, internal notes, session list, Back / Continue
Step 3 Add Lessons -> reminder list, Add lessons / I have added lessons, Back
```
Stepper stays clickable only for completed or active steps; step gating, toasts, error banners and loading spinners are untouched.

## Visual changes

**Page shell**
- Keep the same max-width container, Back button and heading position; restyle the heading as the large plain title used on Homework/Progress instead of the generic `PageTitle` component.
- Back button becomes a rounded outlined pill with a black border.

**Stepper**
- Step circles become 2px black-outlined circles: pending = plain background, active = pastel fill with black border, done = solid black with white tick.
- Connector lines become thicker black lines when complete, muted otherwise.
- Labels/descriptions keep their exact text.

**Step cards**
- Replace the shadcn `Card` shells with rounded 1.5rem, 2px black-outlined surfaces on a pastel tint (step 1 sky, step 2 butter, step 3 mint), each with the existing title and description text and a hand-drawn doodle icon in the header.
- Inner detail boxes (proposal details, session rows, reminder list) become rounded soft white/translucent panels with black outlines instead of default grey borders.
- The amber "Internal notes" block moves to the pastel butter/sand token with black outline, keeping the same wording and conditional empty state.
- Success and error notices become rounded pastel mint / blush blocks with black outline, keeping the same icons and text.

**Controls**
- Primary buttons (Create parent account, Continue, Add lessons) become the solid black rounded pill used elsewhere.
- Secondary/outline buttons (Refresh list, Back, I have added lessons) become transparent rounded pills with black outline.
- The proposal `Select` trigger becomes a rounded black-outlined control; dropdown content gets rounded corners. Options and values unchanged.

## Impact assessment

- No state, effect, query, edge-function call, navigation or role guard is touched, so the onboarding workflow (proposal load, parent creation, HubSpot ticket push, calendar hand-off) behaves identically.
- Disabled states are preserved as-is, so completed-step guarding and the "Parent account created" label switch still work.
- Only this page's markup changes; shared components (`Card`, `Button`, `Select`) are not modified, so nothing else in the app is affected.

## Technical notes

- Colours come from existing `--pastel-*` tokens in `src/index.css`; no hardcoded hex or `bg-white`-style utilities.
- Doodle icons reused from `src/components/calendar/LessonDoodles.tsx`.
