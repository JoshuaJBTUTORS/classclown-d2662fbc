## What exists today (verified)

`src/pages/ProposalBuilder.tsx` holds the proposal form. Its `lessonTimes` state (line 67) is an array of `{ day, time, duration, subject }` rows, editable in the form and submitted at line 115. The page header is a single `CardTitle` "Create Lesson Proposal" (line 148) with no action buttons beside it.

Two Cleo edge functions already exist: `agent-cleo` (read-only SQL agent) and `agent-cleo-create-lesson`. There is no availability/optimisation function.

## Plan

### 1. Button in the builder header

Add an **Optimise with Cleo Agent** button to the right of the "Create Lesson Proposal" title. It is enabled only when at least one lesson-time row has a day, a time and a subject. Clicking it sends the current rows (plus lesson type and the recipient's student context) for analysis and opens a results panel below the header.

Suggestions only — nothing in the form is changed automatically. The admin reads the findings and edits rows by hand if they agree.

### 2. What the optimiser checks

For each proposed row (day + time + subject + duration):

- **Tutor availability** — is there at least one tutor who teaches that subject and is free at that recurring weekday/time slot? Reports the count and names a couple of candidates, or flags the slot as uncovered.
- **Existing group sessions** — is there already a running group for that subject at or near that slot with room to take another student? This is the highest-value finding, so matches are shown first with the group's current size and tutor.
- **Slot popularity / capacity** — how much coverage that weekday/hour generally has versus neighbouring slots, so a thin slot can be nudged to a better-served one (e.g. "Tuesday 19:00 has 1 free Maths tutor; Wednesday 19:00 has 5, and an existing group of 3").

Each finding is tagged green (good as proposed), amber (workable but better options exist) or red (no coverage found), with a one-line reason and the concrete alternative slot where one exists.

### 3. Results panel

Renders under the header as a compact list, one block per proposed lesson row, each showing the status tag, the reason, and any suggested alternative day/time or joinable group. A "Re-run" control repeats the check after the admin edits rows, and dismissing the panel leaves the form untouched.

## Technical notes

- New edge function `agent-cleo-optimise-proposal`: accepts `{ lessonTimes, lessonType, studentContext }`. It runs its own read-only queries against `lessons` (future instances, `is_group`, subject, tutor, day-of-week/time), tutor availability and tutor–subject data, aggregates per proposed slot, then passes the aggregate plus the proposal to the model for ranking and wording. Read-only; no writes anywhere.
- Model: `openai/gpt-5.5` on the Lovable AI Gateway Responses API, streamed per the gateway contract (the aggregation is deterministic SQL; the model only ranks and phrases the suggestions).
- Frontend: new `src/components/proposals/OptimiseProposalPanel.tsx` for the button and results; `ProposalBuilder.tsx` mounts it in the card header and passes the live `lessonTimes` state. No change to the submit path, the proposal schema, or the transcript-prefill flow.
- No database schema changes.
