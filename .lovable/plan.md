## Onboarding wizard — Step 1 error handling + Step 2 session preview

### Step 1: Parent account creation
- Wrap the `create-parent-account` invocation in strict error handling:
  - If the edge function returns an error, or the response contains an `error` field, surface it inline (red alert box under the action button) with the exact message.
  - Show a `toast.error` as well.
  - Do NOT mark step 1 as complete and do NOT advance to step 2.
  - Keep the proposal selected so the user can retry.
- Only on a clean success (parent account created + proposal linked) do we:
  - Mark step 1 complete.
  - Auto-advance to step 2 (or enable Continue and move forward on click — whichever matches current wizard behaviour).

### Step 2: Session preview (read-only)
- Reuse the same proposal selected in step 1 (carry `proposalId` forward in wizard state — no re-picking).
- Fetch the proposal's session/lesson details (subject, day/time, duration, frequency, lesson type, tutor if present) from `lesson_proposals` (and any related session rows already used by the proposal view).
- Render a clean read-only summary card listing each session offered on the proposal:
  - Subject
  - Day + time
  - Duration
  - Frequency / recurrence
  - Lesson type (1-to-1 / group)
- Header copy: "Make a note of the sessions offered" with a short helper line explaining these are the sessions agreed in the proposal and will be scheduled in a later step.
- No edits, no actions — just display + a Continue button to move to step 3 (Review).

### Files to touch
- `src/pages/Onboarding.tsx` — error state on step 1, gating logic, step 2 rendering, carry proposal id.
- Possibly a small helper to parse session details from the proposal record (inline in the page unless a reusable one already exists in `src/components/proposals`).

No database or edge function changes.
