-- Add cleanup functionality for time_off_requests table

-- Create function to delete time_off_requests older than 3 months
CREATE OR REPLACE FUNCTION public.cleanup_old_time_off_requests()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count integer;
BEGIN
  -- Delete time_off_requests older than 3 months
  DELETE FROM public.time_off_requests
  WHERE created_at < NOW() - INTERVAL '3 months';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Log the cleanup operation
  INSERT INTO public.notifications (
    type,
    subject,
    email,
    status,
    created_at
  ) VALUES (
    'system_cleanup',
    'Time Off Requests Cleanup',
    'system@cleanup.com',
    'completed',
    NOW()
  );
  
  RETURN deleted_count;
END;
$$;

-- Add indexes for better performance on filtered queries
CREATE INDEX IF NOT EXISTS idx_time_off_requests_tutor_id ON public.time_off_requests(tutor_id);
CREATE INDEX IF NOT EXISTS idx_time_off_requests_status ON public.time_off_requests(status);
CREATE INDEX IF NOT EXISTS idx_time_off_requests_created_at ON public.time_off_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_time_off_requests_start_date ON public.time_off_requests(start_date);
CREATE INDEX IF NOT EXISTS idx_time_off_requests_end_date ON public.time_off_requests(end_date);