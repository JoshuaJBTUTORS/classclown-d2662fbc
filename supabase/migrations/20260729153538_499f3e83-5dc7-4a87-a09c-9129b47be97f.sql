
-- 1. Create the read-only role (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'agent_cleo_readonly') THEN
    CREATE ROLE agent_cleo_readonly NOLOGIN;
  END IF;
END $$;

-- 2. Grant schema usage and SELECT on all current + future public tables
GRANT USAGE ON SCHEMA public TO agent_cleo_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO agent_cleo_readonly;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO agent_cleo_readonly;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT ON TABLES TO agent_cleo_readonly;

-- 3. Revoke access on sensitive tables
REVOKE ALL ON public.user_roles FROM agent_cleo_readonly;
REVOKE ALL ON public.password_reset_tokens FROM agent_cleo_readonly;
REVOKE ALL ON public.google_oauth_states FROM agent_cleo_readonly;
REVOKE ALL ON public.invitations FROM agent_cleo_readonly;

-- 4. Allow service_role to SET ROLE to it
GRANT agent_cleo_readonly TO service_role;
GRANT agent_cleo_readonly TO postgres;

-- 5. Exec helper: runs SQL as agent_cleo_readonly in a read-only transaction
CREATE OR REPLACE FUNCTION public.agent_cleo_exec(sql text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  result jsonb;
  trimmed text;
BEGIN
  trimmed := btrim(sql);

  -- Basic guard: must begin with SELECT or WITH (defence in depth; role is the real gate)
  IF trimmed !~* '^(select|with)\s' THEN
    RAISE EXCEPTION 'agent_cleo_exec only accepts SELECT / WITH queries';
  END IF;

  -- Set restrictive session parameters and switch to the low-priv role
  PERFORM set_config('statement_timeout', '15000', true);
  PERFORM set_config('role', 'agent_cleo_readonly', true);

  EXECUTE format(
    'SELECT COALESCE(jsonb_agg(row_to_json(t)), ''[]''::jsonb) FROM (%s) t',
    trimmed
  ) INTO result;

  -- Reset role
  PERFORM set_config('role', 'none', true);

  RETURN result;
EXCEPTION WHEN OTHERS THEN
  PERFORM set_config('role', 'none', true);
  RAISE;
END;
$function$;

REVOKE ALL ON FUNCTION public.agent_cleo_exec(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.agent_cleo_exec(text) TO service_role;
