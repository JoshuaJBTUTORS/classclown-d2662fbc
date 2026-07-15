
ALTER TABLE public.student_lesson_insights
  ADD COLUMN IF NOT EXISTS attendance_status text,
  ADD COLUMN IF NOT EXISTS lesson_status text,
  ADD COLUMN IF NOT EXISTS is_meaningful boolean NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_sli_student_week_meaningful
  ON public.student_lesson_insights (student_id, week_start_date)
  WHERE is_meaningful;

CREATE OR REPLACE FUNCTION public.sync_student_lesson_insight()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_lesson public.lessons%ROWTYPE;
  v_student public.students%ROWTYPE;
  v_week_start date;
  v_attendance text;
  v_is_meaningful boolean;
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM public.student_lesson_insights WHERE source_summary_id = OLD.id;
    RETURN OLD;
  END IF;

  SELECT * INTO v_lesson FROM public.lessons WHERE id = NEW.lesson_id;
  IF NOT FOUND THEN RETURN NEW; END IF;

  SELECT * INTO v_student FROM public.students WHERE id = NEW.student_id;
  IF NOT FOUND THEN RETURN NEW; END IF;

  v_week_start := (date_trunc('week', (v_lesson.start_time AT TIME ZONE 'Europe/London')))::date;

  SELECT attendance_status INTO v_attendance
  FROM public.lesson_attendance
  WHERE lesson_id = NEW.lesson_id AND student_id = NEW.student_id
  LIMIT 1;

  v_is_meaningful := COALESCE(
    COALESCE(v_lesson.status, '') <> 'cancelled'
    AND (v_attendance IS NULL OR v_attendance IN ('attended','late'))
    AND (
      COALESCE(array_length(NEW.topics_covered, 1), 0) > 0
      OR NEW.confidence_score IS NOT NULL
    ),
    false
  );

  INSERT INTO public.student_lesson_insights (
    student_id, user_id, parent_id, lesson_id,
    subject, lesson_title, lesson_start_time, week_start_date,
    topics, confidence_score, engagement_score, engagement_level,
    participation_time_percentage, ai_summary, transcription_id, source_summary_id,
    attendance_status, lesson_status, is_meaningful
  )
  VALUES (
    NEW.student_id, v_student.user_id, v_student.parent_id, NEW.lesson_id,
    v_lesson.subject, v_lesson.title, v_lesson.start_time, v_week_start,
    COALESCE(NEW.topics_covered, ARRAY[]::text[]),
    NEW.confidence_score, NEW.engagement_score, NEW.engagement_level,
    NEW.participation_time_percentage, NEW.ai_summary, NEW.transcription_id, NEW.id,
    v_attendance, v_lesson.status, v_is_meaningful
  )
  ON CONFLICT (student_id, lesson_id) DO UPDATE
    SET user_id = EXCLUDED.user_id,
        parent_id = EXCLUDED.parent_id,
        subject = EXCLUDED.subject,
        lesson_title = EXCLUDED.lesson_title,
        lesson_start_time = EXCLUDED.lesson_start_time,
        week_start_date = EXCLUDED.week_start_date,
        topics = EXCLUDED.topics,
        confidence_score = EXCLUDED.confidence_score,
        engagement_score = EXCLUDED.engagement_score,
        engagement_level = EXCLUDED.engagement_level,
        participation_time_percentage = EXCLUDED.participation_time_percentage,
        ai_summary = EXCLUDED.ai_summary,
        transcription_id = EXCLUDED.transcription_id,
        source_summary_id = EXCLUDED.source_summary_id,
        attendance_status = EXCLUDED.attendance_status,
        lesson_status = EXCLUDED.lesson_status,
        is_meaningful = EXCLUDED.is_meaningful,
        updated_at = now();

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.resync_insights_for_lesson()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.student_lesson_insights sli
  SET subject = NEW.subject,
      lesson_title = NEW.title,
      lesson_start_time = NEW.start_time,
      week_start_date = (date_trunc('week', (NEW.start_time AT TIME ZONE 'Europe/London')))::date,
      lesson_status = NEW.status,
      is_meaningful = COALESCE(
        COALESCE(NEW.status, '') <> 'cancelled'
        AND (sli.attendance_status IS NULL OR sli.attendance_status IN ('attended','late'))
        AND (
          COALESCE(array_length(sli.topics, 1), 0) > 0
          OR sli.confidence_score IS NOT NULL
        ),
        false
      ),
      updated_at = now()
  WHERE lesson_id = NEW.id;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.sync_insight_attendance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_lesson_id uuid;
  v_student_id bigint;
  v_status text;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_lesson_id := OLD.lesson_id; v_student_id := OLD.student_id; v_status := NULL;
  ELSE
    v_lesson_id := NEW.lesson_id; v_student_id := NEW.student_id; v_status := NEW.attendance_status;
  END IF;

  UPDATE public.student_lesson_insights sli
  SET attendance_status = v_status,
      is_meaningful = COALESCE(
        COALESCE(sli.lesson_status, '') <> 'cancelled'
        AND (v_status IS NULL OR v_status IN ('attended','late'))
        AND (
          COALESCE(array_length(sli.topics, 1), 0) > 0
          OR sli.confidence_score IS NOT NULL
        ),
        false
      ),
      updated_at = now()
  WHERE lesson_id = v_lesson_id AND student_id = v_student_id;

  RETURN COALESCE(NEW, OLD);
END;
$function$;

DROP TRIGGER IF EXISTS trg_sync_insight_attendance ON public.lesson_attendance;
CREATE TRIGGER trg_sync_insight_attendance
AFTER INSERT OR UPDATE OR DELETE ON public.lesson_attendance
FOR EACH ROW EXECUTE FUNCTION public.sync_insight_attendance();

WITH src AS (
  SELECT sli.id AS sli_id,
         la.attendance_status AS att,
         l.status AS lstatus,
         sli.topics,
         sli.confidence_score
  FROM public.student_lesson_insights sli
  JOIN public.lessons l ON l.id = sli.lesson_id
  LEFT JOIN public.lesson_attendance la
    ON la.lesson_id = sli.lesson_id AND la.student_id = sli.student_id
)
UPDATE public.student_lesson_insights sli
SET attendance_status = src.att,
    lesson_status = src.lstatus,
    is_meaningful = COALESCE(
      COALESCE(src.lstatus, '') <> 'cancelled'
      AND (src.att IS NULL OR src.att IN ('attended','late'))
      AND (
        COALESCE(array_length(src.topics, 1), 0) > 0
        OR src.confidence_score IS NOT NULL
      ),
      false
    )
FROM src
WHERE sli.id = src.sli_id;
