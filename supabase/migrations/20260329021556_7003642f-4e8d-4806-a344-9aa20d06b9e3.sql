
-- Part 1: One-time data fix - shift future lesson times back 1 hour for BST
-- This corrects lessons that were stored as UTC=UK wall-clock during GMT
-- and now display 1 hour late under BST
UPDATE lessons
SET start_time = start_time - INTERVAL '1 hour',
    end_time = end_time - INTERVAL '1 hour'
WHERE start_time >= '2026-03-29T01:00:00+00'
  AND status != 'completed';

-- Part 2: Fix extend_recurring_lessons() to be DST-aware
CREATE OR REPLACE FUNCTION public.extend_recurring_lessons()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  recurring_group RECORD;
  lesson_record RECORD;
  new_lesson_id UUID;
  working_date DATE;
  extension_date DATE;
  days_to_add INTEGER;
  uk_start_time TIME;
  uk_end_time TIME;
  new_start_ts TIMESTAMPTZ;
  new_end_ts TIMESTAMPTZ;
BEGIN
  FOR recurring_group IN 
    SELECT * FROM recurring_lesson_groups 
    WHERE next_extension_date <= NOW() + INTERVAL '7 days'
  LOOP
    SELECT * INTO lesson_record FROM lessons WHERE id = recurring_group.original_lesson_id;
    
    IF lesson_record.id IS NOT NULL THEN
      working_date := recurring_group.next_extension_date::DATE;
      extension_date := working_date + INTERVAL '3 months';
      
      -- Extract the UK wall-clock time from the original lesson
      uk_start_time := (lesson_record.start_time AT TIME ZONE 'Europe/London')::TIME;
      uk_end_time := (lesson_record.end_time AT TIME ZONE 'Europe/London')::TIME;
      
      WHILE working_date <= extension_date LOOP
        IF lesson_record.recurrence_interval = 'daily' THEN
          days_to_add := 1;
        ELSIF lesson_record.recurrence_interval = 'weekly' THEN
          days_to_add := 7;
        ELSIF lesson_record.recurrence_interval = 'biweekly' THEN
          days_to_add := 14;
        ELSIF lesson_record.recurrence_interval = 'monthly' THEN
          days_to_add := 30;
        ELSE
          days_to_add := 7;
        END IF;
        
        working_date := working_date + days_to_add;
        
        IF NOT EXISTS (
          SELECT 1 FROM lessons 
          WHERE DATE(start_time) = working_date 
          AND tutor_id = lesson_record.tutor_id
          AND title = lesson_record.title
        ) AND working_date <= extension_date THEN
          
          -- Build timezone-aware timestamps preserving UK wall-clock time
          new_start_ts := (working_date || ' ' || uk_start_time)::timestamp AT TIME ZONE 'Europe/London';
          new_end_ts := (working_date || ' ' || uk_end_time)::timestamp AT TIME ZONE 'Europe/London';
          
          INSERT INTO lessons (
            title, description, tutor_id, start_time, end_time, 
            is_group, status, subject, lesson_type, is_recurring,
            recurrence_interval, recurrence_day, recurrence_end_date
          ) VALUES (
            lesson_record.title,
            lesson_record.description,
            lesson_record.tutor_id,
            new_start_ts,
            new_end_ts,
            lesson_record.is_group,
            'scheduled',
            lesson_record.subject,
            lesson_record.lesson_type,
            FALSE,
            NULL,
            NULL,
            NULL
          ) RETURNING id INTO new_lesson_id;
          
          INSERT INTO lesson_students (lesson_id, student_id)
          SELECT new_lesson_id, student_id
          FROM lesson_students
          WHERE lesson_id = recurring_group.original_lesson_id;
          
        END IF;
      END LOOP;
      
      UPDATE recurring_lesson_groups 
      SET next_extension_date = extension_date + INTERVAL '1 day',
          updated_at = NOW()
      WHERE id = recurring_group.id;
    END IF;
  END LOOP;
END;
$function$;
