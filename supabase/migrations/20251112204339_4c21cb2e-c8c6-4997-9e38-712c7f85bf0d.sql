-- Fix the initialize_free_session_quota function to avoid column name ambiguity
CREATE OR REPLACE FUNCTION public.initialize_free_session_quota()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
      total_sessions_allowed,
      sessions_used,
      sessions_remaining,
      bonus_sessions
    ) VALUES (
      NEW.id,
      period_start_var,
      period_end_var,
      3,
      0,
      0,  -- Set to 0 to avoid double-count with bonus_sessions
      3
    )
    ON CONFLICT (user_id, period_start) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    -- Don't block user creation if quota provisioning fails
    RAISE WARNING 'initialize_free_session_quota failed for user %: %', NEW.id, SQLERRM;
  END;
  
  RETURN NEW;
END;
$$;

-- Ensure the trigger exists on profiles table
DROP TRIGGER IF EXISTS trg_init_free_quota ON public.profiles;
CREATE TRIGGER trg_init_free_quota
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.initialize_free_session_quota();