# Weekly Homework Summary → Push to HeyCleo

Build only the CRM sender here. HeyCleo (separate Supabase project) will host the receiver — out of scope for this project. The sender mirrors the design conventions of `heycleo-homework-webhook` for consistency (CORS, shared-secret via `HEYCLEO_CROSS_PLATFORM_SECRET`, structured logging, snake_case JSON, `notifications` table for observability).

## 1. New sender edge function: `weekly-homework-sync`

`supabase/functions/weekly-homework-sync/index.ts`

- `corsHeaders` + `OPTIONS` handler; POST-only.
- Auth: requires either an admin/owner JWT OR the service-role key (for cron).
- Input (all optional): `{ week_start?: "YYYY-MM-DD", student_ids?: number[], dry_run?: boolean }`. Defaults to the London Mon–Sun that just ended.
- Reads:
  - `students` (active, with email or parent email).
  - `lesson_student_summaries.homework_brief` joined to `lessons` where `start_time` ∈ week AND `status <> 'cancelled'`.
  - `lesson_attendance` to exclude non-attended lessons (keeps `attended`, `late`, or null).
- Aggregation per student per subject:
  - `topics`: deduped union
  - `year_group`: most common
  - `difficulty_tag`: max (1 or 2 — per existing homework brief rule)
  - `lesson_count`
- Payload per student (posted individually so one bad student doesn't block others):
  ```json
  {
    "secret": "<HEYCLEO_CROSS_PLATFORM_SECRET>",
    "sync_id": "<sha256(student_id + week_start)>",
    "week_start": "YYYY-MM-DD",
    "week_end": "YYYY-MM-DD",
    "student": { "id", "first_name", "last_name", "email", "parent_email" },
    "subjects": [
      { "subject", "year_group", "topics": [...], "difficulty_tag": 2, "lesson_count": 2 }
    ]
  }
  ```
- POSTs to `HEYCLEO_WEEKLY_HOMEWORK_URL` (new secret — the HeyCleo receiver endpoint) with `x-heycleo-secret` header AND `secret` in body (matches existing receiver's dual-accept design). Retries on 5xx with exponential backoff (up to 3 attempts).
- Skips students with zero meaningful lessons.
- Logs each outcome to `notifications` (`type = 'heycleo_weekly_homework_sync'`, subject = student email, status = `sent | failed | skipped`).
- Returns `{ success, week_start, week_end, sent, failed, skipped }`.

## 2. Scheduled trigger (pg_cron)

Via `supabase--insert` (project-specific URL + anon key, per project rule):
- `0 6 * * 1` — every Monday 06:00 UTC (~07:00 London BST / 06:00 GMT). Fires the sender for the just-completed week.

## 3. Admin manual trigger

On `src/pages/StudentsList.tsx`, add an owner/admin-only "Sync weekly homework to HeyCleo" button with a small dropdown (this week / previous week / custom Monday). Calls `weekly-homework-sync` and toasts the returned counts. No other UI changes.

## Secret required

- **`HEYCLEO_WEEKLY_HOMEWORK_URL`** — the endpoint on the HeyCleo project you'll POST to (e.g. `https://<heycleo-project>.functions.supabase.co/weekly-homework-receiver`). I'll request this via `add_secret` at implementation time — please have the URL ready.
- Reuses existing `HEYCLEO_CROSS_PLATFORM_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_URL`.

## Files touched

- `supabase/functions/weekly-homework-sync/index.ts` (new)
- `src/pages/StudentsList.tsx` (button + handler)
- pg_cron entry (one-off via `supabase--insert`)

No schema migrations. No frontend business-logic changes elsewhere.
