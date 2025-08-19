-- Fix the notify_time_off_request trigger function to use correct net.http_post parameters
CREATE OR REPLACE FUNCTION public.notify_time_off_request()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  -- Only send notification for new requests (INSERT)
  IF TG_OP = 'INSERT' THEN
    BEGIN
      -- Call the edge function to send notifications with correct parameter types
      PERFORM net.http_post(
        url := 'https://sjxbxkpegcnnfjbsxazo.supabase.co/functions/v1/send-timeoff-notification',
        body := json_build_object('record', row_to_json(NEW)),
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqeGJ4a3BlZ2NubmZqYnN4YXpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3MTE2NzIsImV4cCI6MjA2MzI4NzY3Mn0.QFNyi5omwRMPiL_nJlUOHo5ATwXd14PdQHfoG7oTnwA"}'::jsonb
      );
    EXCEPTION WHEN OTHERS THEN
      -- Log the error but don't fail the transaction
      RAISE WARNING 'Failed to send time-off notification: %', SQLERRM;
    END;
  END IF;
  
  RETURN NEW;
END;
$function$;