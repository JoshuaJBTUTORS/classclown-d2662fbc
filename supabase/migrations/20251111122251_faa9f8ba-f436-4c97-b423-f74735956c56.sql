-- Fix double-counting of free sessions
-- Set sessions_remaining to 0 for all free session quotas
-- Only bonus_sessions should be used for the 3 free sessions

UPDATE voice_session_quotas
SET 
  sessions_remaining = 0,
  updated_at = NOW()
WHERE sessions_remaining > 0 
  AND bonus_sessions > 0
  AND total_sessions_allowed = 3;