# Clear impact moments and add an Agent Cleo alert banner for them

Two parts: wipe the current weak backlog of high-impact moments, then surface new ones on the Agent Cleo home screen exactly like the tutor breach alerts.

## 1. Delete the existing moments

All 37 rows in `student_impact_moments` are from the old, loose detection rules. They get deleted outright so only moments found under the tightened criteria appear from now on.

## 2. New "high-impact moments" banner on /agent-cleo

Sits directly under the existing breach banner, same visual language (thick black border, hard shadow, rounded card) but a warmer non-alarming colour so it reads as an opportunity, not a problem.

Each moment card shows:
- Urgency pill (high / medium / low)
- Student name and subject
- What happened: event type, timeframe or date, grade/target if stated
- Recommended action
- Expandable transcript quotes, same as the breach cards
- Impact score shown small alongside the header

Header line: "N high-impact moment(s) from yesterday's lessons", with a "Dismiss all" link. Individual X buttons dismiss single moments. Dismissals are per-user, so one person clearing their view doesn't hide it from Britney or Hannah. Nothing shows when there's nothing to report.

## Technical details

- Migration: `DELETE FROM public.student_impact_moments;` plus a new `student_impact_moment_dismissals` table (`moment_id`, `user_id`, unique pair, GRANTs for `authenticated`/`service_role`, RLS so a user only sees and writes their own rows).
- `student_impact_moments` currently has no read policy path used by the app — confirm/add an admin+owner `SELECT` policy via `has_role` and the matching `GRANT SELECT ... TO authenticated` so the banner can read it.
- New hook `src/hooks/useStudentImpactMoments.ts`, mirroring `useTutorBreaches.ts`: loads `status = 'new'` rows ordered by `impact_score` desc, filters out this user's dismissals, exposes `dismiss` / `dismissAll` / `reload`.
- New component `src/components/agentCleo/ImpactMomentBanner.tsx`, structured like `BreachAlertBanner.tsx`.
- Rendered in `src/pages/AgentCleo.tsx` immediately after `<BreachAlertBanner />`.
- No changes to `daily-breach-scan` — detection logic stays as tightened.
