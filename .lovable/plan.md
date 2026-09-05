# Plan: Rewrite churn-risk digest as a casual text from Cleo

## Goal
The daily `daily-churn-scan` edge function sends a churn-risk digest email to the core team. It currently reads like a formal system alert ("⚠️ Churn risk", "Automated daily check based on..."). Rewrite the email copy so it reads like a short, casual text message from **Cleo** — e.g. "Hey — I found some students worth looking at, please check..." — while still listing the students, their risk level/score, the reasons, and parent contact info.

## Scope (in `supabase/functions/daily-churn-scan/index.ts`, the digest email block ~lines 415–453)

Only the **email copy** changes — subject line and HTML body. No logic, scoring, scheduling, recipients, or data changes.

1. **Sender / from**: keep `enquiries@classbeyondacademy.io` (per email-config memory) but set the display name to **Cleo** so it reads as a message from Cleo: `Cleo <enquiries@classbeyondacademy.io>`.
2. **Subject line**: casual, e.g. `Hey — ${count} student(s) worth a look today 🙂` (no formal "⚠️ ... at risk of churning").
3. **Body**: conversational opener in Cleo's voice, e.g.
   > Hey! 🙂 I found a few students worth looking at today — could you check in on them?
   >
   > Here's who I flagged on `{date}`:
4. Keep the per-student list (name, risk level, score, reasons, parent contact) but lighten the styling/tone so it feels like a note, not a report. Reasons can keep their plain-English labels.
5. Closing line in Cleo's voice, e.g. `Catch you later — Cleo 🐾` (no "Automated daily check..." footer).

## Verification
- Redeploy `daily-churn-scan` after the edit.
- Trigger a manual run and confirm the email renders with the new copy (no build needed for an edge function; verify via the function response and, if available, a test send).

## Out of scope
- No changes to breach-scan email, churn detection logic, thresholds, RLS, the Agent Cleo banner, or scheduling.
