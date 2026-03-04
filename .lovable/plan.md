

# Fix: Redeploy WhatsApp Lesson Reminder Functions

## Root Cause

The cron jobs for lesson reminders are correctly configured in `pg_cron`:
- `lesson-reminders-morning-regular` (5:00 AM UTC) - calls `send-lesson-reminder` with `{"timeframe": "today"}`
- `lesson-reminders-evening-regular` (7:00 PM UTC) - calls `send-lesson-reminder` with `{"timeframe": "tomorrow"}`
- `trial-lesson-reminders-morning` (5:00 AM UTC) - calls `send-trial-lesson-reminder` with `{"timeframe": "today"}`
- `trial-lesson-reminders-evening` (7:00 PM UTC) - calls `send-trial-lesson-reminder` with `{"timeframe": "tomorrow"}`

However, **both edge functions have zero logs** (not even boot/shutdown events), which confirms they are **not deployed**. The cron jobs send HTTP requests to non-existent endpoints, which fail silently.

## Fix

Redeploy both edge functions:
1. `send-lesson-reminder` - handles regular lesson WhatsApp + email reminders
2. `send-trial-lesson-reminder` - handles trial/demo lesson WhatsApp + email reminders

The code for both functions is already correct and complete in the codebase. No code changes are needed -- just redeployment.

**Potential blocker**: A previous deployment failed due to the Supabase plan's maximum function limit. If this limit is still hit, you may need to delete unused functions or upgrade your Supabase plan before these can be deployed.

## Files

No code changes required. Only deployment of existing functions.

