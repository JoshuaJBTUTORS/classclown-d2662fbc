# Daily Snapshot Dashboard on Agent Cleo

Add a compact, high-level daily dashboard to the Agent Cleo landing screen so it works as the true entry point for admins/owners.

## Where it goes

On `/agent-cleo`, in the empty-state view (the "How can I help today?" screen), between the heading and the existing suggestion cards. Once a conversation starts, the chat takes over as it does today — the dashboard only shows on the landing screen.

## What it shows

A row of small stat tiles for today (Europe/London day boundaries):

- Sessions today — count of lessons scheduled today, with how many have already finished vs still to come
- Trial lessons today — trial bookings scheduled today
- Time off requests — count currently pending approval
- Proposals signed — signed/completed this week (with today's count called out)

Below that, a slim "Team goals" strip mirroring `/goals`: Trial lessons booked, Lessons scheduled, Proposals completed, Customers — each as current / target with a thin progress bar and the same on-track / behind / achieved status colouring. No editing here; it links through to `/goals` for detail.

Every tile is clickable and routes to the relevant page (calendar, trial bookings, time off requests, signed proposals, goals).

## Behaviour

- Loads on mount with skeleton placeholders; a small refresh control re-fetches.
- Dark styling matching the existing Agent Cleo shell (subtle bordered cards on the dark background), not the pastel `/goals` palette.
- Any tile that fails to load shows a dash rather than breaking the page.

## Technical notes

- New `src/components/agentCleo/DailySnapshot.tsx` plus a `useDailySnapshot` hook holding the queries; `AgentCleo.tsx` only renders it in the `!hasMessages` branch.
- Queries via the existing supabase client: `lessons` (today range, split trial vs non-trial), `trial_bookings` (today), `time_off_requests` (pending), `lesson_proposals` (status completed, this week).
- Goals strip reuses the same targets and status logic as `src/pages/Goals.tsx` — extract the constants and `computeStatus` into a shared `src/lib/goals.ts` so both pages stay in sync.
- No database or edge function changes.
