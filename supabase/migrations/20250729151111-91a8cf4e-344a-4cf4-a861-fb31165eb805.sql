-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule parent reminders every 6 weeks starting from September 1st
-- This will run every Sunday at 10:00 AM during the 6th week of each cycle
SELECT cron.schedule(
  'school-progress-parent-reminders',
  '0 10 * * 0', -- Every Sunday at 10:00 AM
  $$
  SELECT
    net.http_post(
        url:='https://sjxbxkpegcnnfjbsxazo.supabase.co/functions/v1/send-school-progress-reminder',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqeGJ4a3BlZ2NubmZqYnN4YXpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3MTE2NzIsImV4cCI6MjA2MzI4NzY3Mn0.QFNyi5omwRMPiL_nJlUOHo5ATwXd14PdQHfoG7oTnwA"}'::jsonb,
        body:=concat('{"testMode": false}')::jsonb
    ) as request_id;
  $$
);

-- Schedule admin summary emails to run 3 days after the parent reminders
-- This will run every Wednesday at 2:00 PM during the 6th week of each cycle
SELECT cron.schedule(
  'school-progress-admin-summary',
  '0 14 * * 3', -- Every Wednesday at 2:00 PM
  $$
  SELECT
    net.http_post(
        url:='https://sjxbxkpegcnnfjbsxazo.supabase.co/functions/v1/send-school-progress-summary',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqeGJ4a3BlZ2NubmZqYnN4YXpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3MTE2NzIsImV4cCI6MjA2MzI4NzY3Mn0.QFNyi5omwRMPiL_nJlUOHo5ATwXd14PdQHfoG7oTnwA"}'::jsonb,
        body:=concat('{"testMode": false}')::jsonb
    ) as request_id;
  $$
);

-- Create a function to update cycles (mark current as inactive and activate next)
CREATE OR REPLACE FUNCTION public.advance_school_progress_cycle()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_cycle_id UUID;
  next_cycle_id UUID;
BEGIN
  -- Get the current active cycle
  SELECT id INTO current_cycle_id
  FROM public.school_progress_cycles
  WHERE is_active = true
  AND current_date > cycle_end_date
  LIMIT 1;
  
  IF current_cycle_id IS NOT NULL THEN
    -- Deactivate current cycle
    UPDATE public.school_progress_cycles
    SET is_active = false
    WHERE id = current_cycle_id;
    
    -- Find and activate next cycle
    SELECT id INTO next_cycle_id
    FROM public.school_progress_cycles
    WHERE is_active = false
    AND cycle_start_date > (
      SELECT cycle_end_date
      FROM public.school_progress_cycles
      WHERE id = current_cycle_id
    )
    ORDER BY cycle_start_date ASC
    LIMIT 1;
    
    IF next_cycle_id IS NOT NULL THEN
      UPDATE public.school_progress_cycles
      SET is_active = true
      WHERE id = next_cycle_id;
      
      -- Log the cycle transition
      INSERT INTO public.notifications (
        type,
        subject,
        email,
        status,
        created_at
      ) VALUES (
        'system_cycle_change',
        'School Progress Cycle Advanced',
        'system@jb-tutors.com',
        'completed',
        NOW()
      );
    END IF;
  END IF;
END;
$$;

-- Schedule cycle advancement to run daily at midnight
SELECT cron.schedule(
  'advance-school-progress-cycles',
  '0 0 * * *', -- Every day at midnight
  $$
  SELECT public.advance_school_progress_cycle();
  $$
);

-- Create a function to auto-generate future cycles
CREATE OR REPLACE FUNCTION public.generate_future_school_progress_cycles()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  last_cycle_end DATE;
  new_start_date DATE;
  new_end_date DATE;
  cycle_count INTEGER := 0;
BEGIN
  -- Get the last cycle end date
  SELECT MAX(cycle_end_date) INTO last_cycle_end
  FROM public.school_progress_cycles;
  
  -- Generate cycles for the next year if we're within 3 months of the last cycle
  IF last_cycle_end IS NOT NULL AND last_cycle_end <= (CURRENT_DATE + INTERVAL '3 months') THEN
    new_start_date := last_cycle_end + INTERVAL '1 day';
    
    -- Generate 8 cycles (approximately 1 year)
    WHILE cycle_count < 8 LOOP
      new_end_date := new_start_date + INTERVAL '6 weeks' - INTERVAL '1 day';
      
      -- Insert new cycle (inactive by default)
      INSERT INTO public.school_progress_cycles (
        cycle_start_date,
        cycle_end_date,
        is_active
      ) VALUES (
        new_start_date,
        new_end_date,
        false
      );
      
      new_start_date := new_end_date + INTERVAL '1 day';
      cycle_count := cycle_count + 1;
    END LOOP;
    
    -- Log the generation
    INSERT INTO public.notifications (
      type,
      subject,
      email,
      status,
      created_at
    ) VALUES (
      'system_cycle_generation',
      CONCAT('Generated ', cycle_count, ' new school progress cycles'),
      'system@jb-tutors.com',
      'completed',
      NOW()
    );
  END IF;
END;
$$;

-- Schedule future cycle generation to run monthly
SELECT cron.schedule(
  'generate-future-cycles',
  '0 1 1 * *', -- First day of every month at 1:00 AM
  $$
  SELECT public.generate_future_school_progress_cycles();
  $$
);