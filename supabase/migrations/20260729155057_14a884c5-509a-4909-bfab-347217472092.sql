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

  IF trimmed !~* '^(select|with)\s' THEN
    RAISE EXCEPTION 'agent_cleo_exec only accepts SELECT / WITH queries';
  END IF;

  IF trimmed ~ ';' OR trimmed ~ '--' OR trimmed ~ '/\*' THEN
    RAISE EXCEPTION 'agent_cleo_exec only accepts a single read-only statement without comments';
  END IF;

  IF trimmed ~* '(^|[^a-z_])(insert|update|delete|merge|alter|create|drop|truncate|grant|revoke|copy|call|do|execute|perform|set|reset|listen|notify|unlisten|vacuum|analyze|reindex|cluster|refresh|discard|lock|comment|security|prepare|deallocate|commit|rollback|savepoint|release)([^a-z_]|$)' THEN
    RAISE EXCEPTION 'agent_cleo_exec rejected a non-read-only keyword';
  END IF;

  IF trimmed ~* '(^|[^a-z_])into\s+(temp|temporary|unlogged|table)?\s*[a-z_".]' THEN
    RAISE EXCEPTION 'agent_cleo_exec rejected SELECT INTO';
  END IF;

  -- Keep Agent Cleo focused on CRM data and block auth/storage/internal schemas.
  IF trimmed ~* '(^|[^a-z_])(auth|storage|vault|realtime|net|graphql|graphql_public|pgbouncer|supabase_functions|extensions|pgsodium)\s*\.' THEN
    RAISE EXCEPTION 'agent_cleo_exec cannot access internal schemas';
  END IF;

  IF trimmed ~* '\b(pg_authid|pg_shadow|pg_user|pg_roles|pg_settings|pg_file_settings|pg_stat_activity|pg_stat_replication|pg_stat_ssl|pg_stat_gssapi|pg_prepared_statements|pg_backend_memory_contexts)\b' THEN
    RAISE EXCEPTION 'agent_cleo_exec cannot access sensitive system catalog data';
  END IF;

  IF trimmed ~* '\bpublic\.[a-z_][a-z0-9_]*\s*\(' THEN
    RAISE EXCEPTION 'agent_cleo_exec does not allow calls to public functions';
  END IF;

  IF trimmed ~* '\b(agent_cleo_exec|advance_school_progress_cycle|assign_video_number|calculate_course_completion|calculate_session_score|can_access_homework|can_access_homework_submission|check_learning_hub_access|clean_expired_oauth_states|cleanup_active_assignment_on_video_status|cleanup_expired_reset_tokens|cleanup_old_time_off_requests|delete_expired_invitations|extend_recurring_lessons|generate_future_school_progress_cycles|get_course_exam_board_specifications|get_current_school_progress_cycle|get_current_tutor_id|get_current_user_email|get_current_user_parent_id|get_current_user_student_id|get_current_user_tutor_id|get_current_week_number|get_next_lesson|get_primary_role|get_user_best_assessment_score|get_user_platform_subscription|get_user_purchased_courses|handle_new_user|handle_updated_at|has_role|initialize_free_session_quota|initialize_user_gamification_stats|notify_time_off_request|parent_notified_in_cycle|resync_insights_for_lesson|set_assessment_attempt_number|sync_insight_attendance|sync_student_lesson_insight|toggle_cleo_hub_access|trigger_hourly_lesson_processing|update_blog_updated_at|update_cleo_updated_at|update_content_updated_at|update_failed_room_creations_updated_at|update_lesson_plans_updated_at|update_modified_column|update_platform_subscription_updated_at|update_tutor_earning_goals_updated_at|update_updated_at_column|update_updated_at_timestamp|user_can_edit_assessment|user_can_take_assessment|user_has_purchased_course|net\.|http_|pg_sleep|nextval|setval|lo_[a-z0-9_]*)\s*\(' THEN
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