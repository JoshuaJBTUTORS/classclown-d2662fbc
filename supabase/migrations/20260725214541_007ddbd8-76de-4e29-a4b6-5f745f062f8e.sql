ALTER TABLE public.lesson_student_summaries ADD COLUMN IF NOT EXISTS attendance_status text;

-- Backfill: mark existing summaries as did-not-attend for absent/excused students
UPDATE public.lesson_student_summaries lss
SET attendance_status = la.attendance_status,
    engagement_level = NULL,
    engagement_score = NULL,
    confidence_score = NULL,
    participation_time_percentage = NULL,
    ai_summary = CASE
      WHEN la.attendance_status = 'excused' THEN 'Marked as excused absence.'
      ELSE 'Student did not attend this lesson.'
    END
FROM public.lesson_attendance la
WHERE la.lesson_id = lss.lesson_id
  AND la.student_id = lss.student_id
  AND la.attendance_status IN ('absent','excused');