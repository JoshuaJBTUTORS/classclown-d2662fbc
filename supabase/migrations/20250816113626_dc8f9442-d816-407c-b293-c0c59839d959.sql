-- Create function to trigger time-off notifications
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to call the notification function
CREATE OR REPLACE TRIGGER time_off_notification_trigger
  AFTER INSERT ON time_off_requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_time_off_request();