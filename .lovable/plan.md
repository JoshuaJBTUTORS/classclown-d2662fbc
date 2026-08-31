# Role-based Agent Cleo dashboard

## Goal
Tailor the Agent Cleo dashboard (DailySnapshot) per team member, driven by the `job_title` stored on their profile. Chat behaviour stays the same for everyone — only the dashboard metrics change.

## How it works
A config maps each job title to the metric tiles and goal bars that matter for that role:

| Job title | Dashboard focus |
|---|---|
| CEO (Joshua) | Everything — sessions today, trials, time off, proposals signed, all 4 goal bars, breach alerts |
| Head of Growth (Britney) | Trials today, proposals signed, new customers, trials + proposals + customers goal bars |
| Customer Success Specialist (Hannah) | Sessions today, missed/absent lessons, time off requests, homework completion, breach alerts |
| Sales Development Representative (Musa) | Trials booked today, proposals awaiting signature, proposals signed, trials + proposals goal bars |
| No title / unknown | Current full snapshot (unchanged default) |

The existing tiles not relevant to a role are simply hidden; the layout reflows.

## Technical details
- New file `src/lib/agentCleoRoleConfig.ts`: normalizes `job_title` (lowercase, trimmed) and returns the list of tile keys + goal keys for that role, with a safe fallback to the full set.
- `src/components/agentCleo/DailySnapshot.tsx`: reads `profile.job_title` via `useAuth()`, looks up the config, and renders only the configured tiles/goals. No changes to the underlying data hook — `useDailySnapshot.ts` keeps fetching as today (it already powers the goals page too), we just filter what's displayed. If a role needs a metric that isn't currently fetched (e.g. "proposals awaiting signature" for Musa, "homework completion" for Hannah), extend `useDailySnapshot` with those lightweight count queries.
- `BreachAlertBanner` already shows for everyone — leave as is (Joshua/Hannah see it; it self-hides when there are no breaches).
- No database changes: `profiles.job_title` already exists and is populated. Titles can later be edited from the Staff page and the dashboard adapts automatically.
- No changes to the Agent Cleo chat, edge functions, greeting, or quote.

## Verification
- Typecheck + build.
- Confirm each known title maps to the expected tile set; unknown/blank title shows the current full snapshot.
