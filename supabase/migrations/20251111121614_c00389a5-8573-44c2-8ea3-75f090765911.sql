-- Backfill 3 free sessions for all existing users who don't have any quota yet
INSERT INTO public.voice_session_quotas (
  user_id,
  period_start,
  period_end,
  total_sessions_allowed,
  sessions_used,
  sessions_remaining,
  bonus_sessions
)
SELECT 
  p.id as user_id,
  NOW() as period_start,
  NOW() + INTERVAL '30 days' as period_end,
  3 as total_sessions_allowed,
  0 as sessions_used,
  3 as sessions_remaining,
  3 as bonus_sessions
FROM profiles p
WHERE NOT EXISTS (
  SELECT 1 
  FROM voice_session_quotas vsq 
  WHERE vsq.user_id = p.id
);