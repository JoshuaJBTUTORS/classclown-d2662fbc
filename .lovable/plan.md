## Prevent skipping steps in the Onboarding stepper

In `src/pages/Onboarding.tsx`, the stepper circles (1, 2, 3) are clickable and call `setCurrentStep(step.id)` unconditionally, letting users jump ahead without completing prior steps.

### Change
Restrict stepper navigation so users can only:
- Click the current step (no-op), or
- Click a step that has already been completed (to go back and review)

Any step that is not yet completed and is ahead of the current step will be non-clickable (disabled cursor, no action).

### Technical details
- Update the `<button>` in the stepper to compute `canNavigate = isDone || isActive`.
- Set `disabled={!canNavigate}` and only call `setCurrentStep` when allowed.
- Adjust styling (`cursor-not-allowed opacity` on locked steps) so it's visually clear future steps are locked until the current one is finished.
- No changes to the actual step completion logic — Step 1 already pushes `1` into `completed` after parent creation, Step 2 pushes `2` on continue, so gating uses the existing `completed` array.