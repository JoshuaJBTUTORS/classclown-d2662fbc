CREATE OR REPLACE FUNCTION public.agent_cleo_exec(sql text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
SET statement_timeout = '15s'
AS $function$
DECLARE
  result jsonb;
  trimmed text;
BEGIN
  trimmed := btrim(sql);

  IF trimmed IS NULL OR trimmed = '' THEN
    RAISE EXCEPTION 'agent_cleo_exec requires a query';
  END IF;

  -- Only allow one read-only statement. This is intentionally conservative.
  IF trimmed !~* '^(select|with)\s' THEN
    RAISE EXCEPTION 'agent_cleo_exec only accepts SELECT / WITH queries';
  END IF;

  IF trimmed ~ ';' OR trimmed ~ '--' OR trimmed ~ '/\*' THEN
    RAISE EXCEPTION 'agent_cleo_exec only accepts a single read-only statement without comments';
  END IF;

  -- Block data changes, DDL, session changes, and administrative statements even inside CTEs.
  IF trimmed ~* '(^|[^a-z_])(insert|update|delete|merge|alter|create|drop|truncate|grant|revoke|copy|call|do|execute|perform|set|reset|listen|notify|unlisten|vacuum|analyze|reindex|cluster|refresh|discard|lock|comment|security|prepare|deallocate|commit|rollback|savepoint|release)([^a-z_]|$)' THEN
    RAISE EXCEPTION 'agent_cleo_exec rejected a non-read-only keyword';
  END IF;

  -- Prevent SELECT INTO table creation.
  IF trimmed ~* '(^|[^a-z_])into\s+(temp|temporary|unlogged|table)?\s*[a-z_".]' THEN
    RAISE EXCEPTION 'agent_cleo_exec rejected SELECT INTO';
  END IF;

  -- Prevent calling project SECURITY DEFINER / maintenance helpers through SELECT.
  IF trimmed ~* '\bpublic\.[a-z_][a-z0-9_]*\s*\(' THEN
    RAISE EXCEPTION 'agent_cleo_exec does not allow calls to public functions';
  END IF;

  IF trimmed ~* '\b(agent_cleo_exec|advance_school_progress_cycle|cleanup_[a-z0-9_]*|clean_expired_oauth_states|extend_recurring_lessons|generate_future_school_progress_cycles|initialize_[a-z0-9_]*|notify_time_off_request|sync_[a-z0-9_]*|toggle_cleo_hub_access|trigger_hourly_lesson_processing|update_[a-z0-9_]*|delete_expired_invitations|assign_video_number|set_assessment_attempt_number|resync_insights_for_lesson|net\.|http_|pg_sleep|nextval|setval|lo_[a-z0-9_]*)\s*\(' THEN
    RAISE EXCEPTION 'agent_cleo_exec rejected a function call that is not allowed';
  END IF;

  EXECUTE format(
    'SELECT COALESCE(jsonb_agg(row_to_json(t)), ''[]''::jsonb) FROM (%s) t',
    trimmed
  ) INTO result;

  RETURN result;
END;
$function$;

REVOKE ALL ON FUNCTION public.agent_cleo_exec(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.agent_cleo_exec(text) FROM anon;
REVOKE ALL ON FUNCTION public.agent_cleo_exec(text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.agent_cleo_exec(text) TO service_role;