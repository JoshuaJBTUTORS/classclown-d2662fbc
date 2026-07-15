-- 1) Table
CREATE TABLE public.student_lesson_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id bigint NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  user_id uuid,
  parent_id uuid,
  lesson_id uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  subject text,
  lesson_title text,
  lesson_start_time timestamptz,
  week_start_date date,
  topics text[] NOT NULL DEFAULT ARRAY[]::text[],
  confidence_score integer,
  engagement_score integer,
  engagement_level text,
  participation_time_percentage numeric,
  ai_summary text,
  transcription_id uuid REFERENCES public.lesson_transcriptions(id) ON DELETE SET NULL,
  source_summary_id uuid UNIQUE REFERENCES public.lesson_student_summaries(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT student_lesson_insights_student_lesson_unique UNIQUE (student_id, lesson_id)
);

-- 2) Grants (writes are done by SECURITY DEFINER triggers only)
GRANT SELECT ON public.student_lesson_insights TO authenticated;
GRANT ALL   ON public.student_lesson_insights TO service_role;

-- 3) Indexes
CREATE INDEX idx_sli_student_week ON public.student_lesson_insights (student_id, week_start_date);
CREATE INDEX idx_sli_student_subject ON public.student_lesson_insights (student_id, subject);
CREATE INDEX idx_sli_lesson ON public.student_lesson_insights (lesson_id);
CREATE INDEX idx_sli_week ON public.student_lesson_insights (week_start_date);

-- 4) RLS
ALTER TABLE public.student_lesson_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and owners can view all insights"
ON public.student_lesson_insights
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'owner'::public.app_role)
);

CREATE POLICY "Tutors can view insights for their lessons"
ON public.student_lesson_insights
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.lessons l
    WHERE l.id = student_lesson_insights.lesson_id
      AND l.tutor_id = public.get_current_user_tutor_id()
  )
);

CREATE POLICY "Students can view their own insights"
ON public.student_lesson_insights
FOR SELECT
TO authenticated
USING (student_id = public.get_current_user_student_id());

CREATE POLICY "Parents can view their children's insights"
ON public.student_lesson_insights
FOR SELECT
TO authenticated
USING (
  student_id IN (
    SELECT s.id FROM public.students s
    WHERE s.parent_id = public.get_current_user_parent_id()
  )
);

-- 5) updated_at trigger
CREATE TRIGGER trg_sli_updated_at
BEFORE UPDATE ON public.student_lesson_insights
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6) Sync function driven by lesson_student_summaries
CREATE OR REPLACE FUNCTION public.sync_student_lesson_insight()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lesson public.lessons%ROWTYPE;
  v_student public.students%ROWTYPE;
  v_week_start date;
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM public.student_lesson_insights
    WHERE source_summary_id = OLD.id;
    RETURN OLD;
  END IF;

  SELECT * INTO v_lesson FROM public.lessons WHERE id = NEW.lesson_id;
  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  SELECT * INTO v_student FROM public.students WHERE id = NEW.student_id;
  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  v_week_start := (date_trunc('week', (v_lesson.start_time AT TIME ZONE 'Europe/London')))::date;

  INSERT INTO public.student_lesson_insights (
    student_id, user_id, parent_id, lesson_id,
    subject, lesson_title, lesson_start_time, week_start_date,
    topics, confidence_score, engagement_score, engagement_level,
    participation_time_percentage, ai_summary, transcription_id, source_summary_id
  )
  VALUES (
    NEW.student_id, v_student.user_id, v_student.parent_id, NEW.lesson_id,
    v_lesson.subject, v_lesson.title, v_lesson.start_time, v_week_start,
    COALESCE(NEW.topics_covered, ARRAY[]::text[]),
    NEW.confidence_score, NEW.engagement_score, NEW.engagement_level,
    NEW.participation_time_percentage, NEW.ai_summary, NEW.transcription_id, NEW.id
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
        updated_at = now();

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_sync_student_lesson_insight
AFTER INSERT OR UPDATE OR DELETE ON public.lesson_student_summaries
FOR EACH ROW EXECUTE FUNCTION public.sync_student_lesson_insight();

-- 7) Re-sync when a lesson is renamed/rescheduled/re-subjected
CREATE OR REPLACE FUNCTION public.resync_insights_for_lesson()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.student_lesson_insights
  SET subject = NEW.subject,
      lesson_title = NEW.title,
      lesson_start_time = NEW.start_time,
      week_start_date = (date_trunc('week', (NEW.start_time AT TIME ZONE 'Europe/London')))::date,
      updated_at = now()
  WHERE lesson_id = NEW.id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_resync_insights_for_lesson
AFTER UPDATE OF subject, title, start_time ON public.lessons
FOR EACH ROW
WHEN (
  OLD.subject IS DISTINCT FROM NEW.subject
  OR OLD.title IS DISTINCT FROM NEW.title
  OR OLD.start_time IS DISTINCT FROM NEW.start_time
)
EXECUTE FUNCTION public.resync_insights_for_lesson();

-- 8) One-off backfill from existing summaries
INSERT INTO public.student_lesson_insights (
  student_id, user_id, parent_id, lesson_id,
  subject, lesson_title, lesson_start_time, week_start_date,
  topics, confidence_score, engagement_score, engagement_level,
  participation_time_percentage, ai_summary, transcription_id, source_summary_id
)
SELECT
  lss.student_id,
  s.user_id,
  s.parent_id,
  lss.lesson_id,
  l.subject,
  l.title,
  l.start_time,
  (date_trunc('week', (l.start_time AT TIME ZONE 'Europe/London')))::date,
  COALESCE(lss.topics_covered, ARRAY[]::text[]),
  lss.confidence_score,
  lss.engagement_score,
  lss.engagement_level,
  lss.participation_time_percentage,
  lss.ai_summary,
  lss.transcription_id,
  lss.id
FROM public.lesson_student_summaries lss
JOIN public.lessons l ON l.id = lss.lesson_id
JOIN public.students s ON s.id = lss.student_id
ON CONFLICT (student_id, lesson_id) DO NOTHING;