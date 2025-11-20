-- Complete migration to minute-based subscription model
-- Drop all session-based columns from voice_session_quotas

ALTER TABLE voice_session_quotas 
  DROP COLUMN IF EXISTS total_sessions_allowed,
  DROP COLUMN IF EXISTS sessions_used,
  DROP COLUMN IF EXISTS sessions_remaining,
  DROP COLUMN IF EXISTS bonus_sessions;

-- Update initialize_free_session_quota trigger to only create minute-based fields
CREATE OR REPLACE FUNCTION public.initialize_free_session_quota()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  period_start_var timestamptz;
  period_end_var timestamptz;
BEGIN
  period_start_var := NOW();
  period_end_var := period_start_var + INTERVAL '30 days';
  
  BEGIN
    INSERT INTO public.voice_session_quotas (
      user_id,
      period_start,
      period_end,
      total_minutes_allowed,
      minutes_used,
      minutes_remaining,
      bonus_minutes
    ) VALUES (
      NEW.id,
      period_start_var,
      period_end_var,
      15,  -- 15 free minutes
      0,
      15,
      0
    )
    ON CONFLICT (user_id, period_start) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    -- Don't block user creation if quota provisioning fails
    RAISE WARNING 'initialize_free_session_quota failed for user %: %', NEW.id, SQLERRM;
  END;
  
  RETURN NEW;
END;
$function$;