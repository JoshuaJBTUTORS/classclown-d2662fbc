## Add "Proposals Completed" goal to Goals page

Add a fourth goal card to `src/pages/Goals.tsx` tracking completed proposals cumulatively from 1 July 2026 through 31 December 2026.

### Changes to `src/pages/Goals.tsx`

- Add constant `PROPOSALS_GOAL = 390`.
- Import a suitable icon (e.g. `FileCheck` from `lucide-react`).
- Add `proposalCount` state.
- In the data-loading `useEffect`, add a parallel query:
  - Table: `lesson_proposals`
  - Filter: `status = 'completed'`
  - Date range: `completed_at` between `GOAL_START` (July 1, 2026) and `GOAL_DEADLINE` (Dec 31, 2026)
  - Use `count: 'exact', head: true`
- Add a fourth `GoalCard`:
  - Title: "Proposals Completed"
  - Description: `Collective proposals completed by ${deadlineLabel}`
  - Icon: `FileCheck`
  - current: `proposalCount`, target: `PROPOSALS_GOAL`
- Update the grid — already `lg:grid-cols-3`; four cards will wrap cleanly.
- Update the footer targets line to include "390 proposals completed".

### Notes
- Uses the existing `GOAL_START` (already July 1, 2026), so no date constants change.
- If `completed_at` is not the intended field (e.g. should be `agreed_at` or `created_at`), confirm with user — assuming `completed_at` since goal is "proposals completed".
