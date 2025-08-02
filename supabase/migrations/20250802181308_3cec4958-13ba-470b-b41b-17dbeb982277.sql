-- Update RLS policies for lesson_student_summaries to ensure parents only see their children's summaries
DROP POLICY IF EXISTS "Users can view summaries for accessible lessons" ON lesson_student_summaries;

CREATE POLICY "Users can view summaries for accessible lessons" 
ON lesson_student_summaries 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM lessons l
    JOIN user_roles ur ON ur.user_id = auth.uid()
    WHERE l.id = lesson_student_summaries.lesson_id
    AND (
      -- Admin/Owner can see all
      ur.role IN ('admin', 'owner')
      OR 
      -- Tutor can see summaries for their lessons
      (ur.role = 'tutor' AND l.tutor_id = get_current_user_tutor_id())
      OR
      -- Student can see their own summaries
      (ur.role IN ('student', 'parent') AND (
        lesson_student_summaries.student_id = get_current_user_student_id()
        OR 
        -- Parent can see summaries for their children
        lesson_student_summaries.student_id IN (
          SELECT s.id FROM students s 
          WHERE s.parent_id = get_current_user_parent_id()
        )
      ))
    )
  )
);

-- Update RLS policies for lesson_transcriptions to ensure proper access control
DROP POLICY IF EXISTS "Users can view transcriptions for accessible lessons" ON lesson_transcriptions;

CREATE POLICY "Users can view transcriptions for accessible lessons" 
ON lesson_transcriptions 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM lessons l
    JOIN user_roles ur ON ur.user_id = auth.uid()
    WHERE l.id = lesson_transcriptions.lesson_id
    AND (
      -- Admin/Owner can see all
      ur.role IN ('admin', 'owner')
      OR 
      -- Tutor can see transcriptions for their lessons
      (ur.role = 'tutor' AND l.tutor_id = get_current_user_tutor_id())
      OR
      -- Student/Parent can see transcriptions for lessons they're enrolled in
      (ur.role IN ('student', 'parent') AND EXISTS (
        SELECT 1 FROM lesson_students ls
        WHERE ls.lesson_id = l.id
        AND (
          ls.student_id = get_current_user_student_id()
          OR 
          ls.student_id IN (
            SELECT s.id FROM students s 
            WHERE s.parent_id = get_current_user_parent_id()
          )
        )
      ))
    )
  )
);

-- Create cron job to run the hourly lesson processing every hour
SELECT cron.schedule(
  'hourly-lesson-processing',
  '0 * * * *', -- Run every hour at minute 0
  $$
  SELECT
    net.http_post(
        url:='https://sjxbxkpegcnnfjbsxazo.supabase.co/functions/v1/hourly-lesson-processing',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqeGJ4a3BlZ2NubmZqYnN4YXpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3MTE2NzIsImV4cCI6MjA2MzI4NzY3Mn0.QFNyi5omwRMPiL_nJlUOHo5ATwXd14PdQHfoG7oTnwA"}'::jsonb,
        body:=concat('{"timestamp": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);

-- Create a function to manually trigger the hourly processing (useful for testing)
CREATE OR REPLACE FUNCTION public.trigger_hourly_lesson_processing()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM net.http_post(
    url:='https://sjxbxkpegcnnfjbsxazo.supabase.co/functions/v1/hourly-lesson-processing',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqeGJ4a3BlZ2NubmZqYnN4YXpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3MTE2NzIsImV4cCI6MjA2MzI4NzY3Mn0.QFNyi5omwRMPiL_nJlUOHo5ATwXd14PdQHfoG7oTnwA"}'::jsonb,
    body:=concat('{"timestamp": "', now(), '", "manual_trigger": true}')::jsonb
  );
END;
$$;