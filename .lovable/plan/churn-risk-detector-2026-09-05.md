# Churn Risk Detector

Spot students who are drifting before they actually leave, and show the warnings on the Agent Cleo page in the same way tutor breaches appear today.

## What counts as a churn signal

Each student is scored daily over their last 6 lessons. Points are added for:

- **Missed lessons** — 2 or more absences in a row (biggest weight), or 3+ absences in the last 6 lessons.
- **Low confidence** — the student's average confidence is low in absolute terms, and clearly below the average of the other students in the same group lesson.
- **Low speaking share** — the student spoke for a small share of the lesson, and much less than their groupmates.
- **Low engagement** — engagement scores low, and below the group average.
- **Confusion** — count of hesitation/confusion signals already recorded with each lesson summary, compared with peers in the same lesson.
- **Downward trend** — the last 3 lessons are noticeably worse than the 3 before them.

Total score maps to a risk level: **High** (act now), **Medium** (watch), **Low** (ignored, not shown).

Each alert lists the exact reasons ("Missed 2 lessons in a row", "Spoke 6% of the lesson vs 34% group average") plus the lessons involved, so the team can verify before contacting anyone.

## Where it shows up

- A new **Churn risk** banner on `/agent-cleo`, directly under the existing tutor breach banner: same card style, per-reason detail expandable, dismiss per alert and "Dismiss all".
- Dismissals are per user, like breaches, so one person hiding an alert doesn't hide it for everyone.
- Alerts refresh automatically each day; an alert that stops qualifying is closed automatically instead of lingering.
- The daily email digest already sent for breaches gains a churn-risk section listing High and Medium students.

## Technical details

**Database (migration)**
- `student_churn_risks`: id, student_id, student_name, parent_name/email, risk_level, score, reasons (jsonb array of `{code, label, detail}`), lessons_considered (jsonb), missed_streak, avg_confidence, avg_engagement, avg_speaking_pct, peer deltas, status (`open`/`closed`/`resolved`), created_at/updated_at. Unique on `student_id` where status = 'open' so a student has one live alert that is updated, not duplicated.
- `student_churn_dismissals`: id, risk_id, user_id, dismissed_at.
- GRANTs for `authenticated` (select; insert on dismissals) and `service_role` (all), RLS mirroring `tutor_breaches` / `tutor_breach_dismissals` (admin/owner read).

**Edge function `daily-churn-scan`**
- Pulls the last 6 lessons per active student from `lesson_student_summaries` (`attendance_status`, `confidence_score`, `engagement_score`, `participation_time_percentage`, `confidence_indicators`) joined to `lessons` and `lesson_attendance`.
- Peer comparison computed per lesson across the other `lesson_student_summaries` rows for the same `lesson_id`; solo lessons compare against the student's own rolling baseline instead.
- Absence detection uses `attendance_status` from both `lesson_attendance` and the summary row, and skips engagement/confidence scoring for missed lessons (consistent with the existing "missed" handling in `generate-lesson-summaries`).
- Deterministic scoring, no AI call — cheap, repeatable, explainable.
- Upserts open risks, closes rows that no longer qualify, and appends a churn section to the existing daily digest email recipients.
- Bounded work per run (batch cap), idempotent per day.

**Scheduling**
- pg_cron job daily (after the breach scan), calling the function over HTTP like the existing daily jobs.

**Frontend**
- `src/hooks/useStudentChurnRisks.ts` — mirrors `useTutorBreaches` (load open rows, filter user dismissals, `dismiss`, `dismissAll`).
- `src/components/agentCleo/ChurnRiskBanner.tsx` — same visual language as `BreachAlertBanner`, amber/teal tone for risk levels.
- Rendered in `src/pages/AgentCleo.tsx` below `BreachAlertBanner`.
