-- Fix security issue for the newly created function
CREATE OR REPLACE FUNCTION notify_time_off_request()
RETURNS TRIGGER AS $$
BEGIN
  -- Only send notification for new requests (INSERT)
  IF TG_OP = 'INSERT' THEN
    -- Call the edge function to send notifications
    PERFORM net.http_post(
      url := 'https://sjxbxkpegcnnfjbsxazo.supabase.co/functions/v1/send-timeoff-notification',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqeGJ4a3BlZ2NubmZqYnN4YXpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3MTE2NzIsImV4cCI6MjA2MzI4NzY3Mn0.QFNyi5omwRMPiL_nJlUOHo5ATwXd14PdQHfoG7oTnwA"}'::jsonb,
      body := json_build_object('record', row_to_json(NEW))::text
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';