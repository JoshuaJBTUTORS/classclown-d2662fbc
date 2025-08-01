-- Create daily processing logs table
CREATE TABLE public.daily_processing_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  processing_date DATE NOT NULL,
  lessons_found INTEGER DEFAULT 0,
  sessions_discovered INTEGER DEFAULT 0,
  transcriptions_retrieved INTEGER DEFAULT 0,
  summaries_generated INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
  error_details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.daily_processing_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage processing logs"
ON public.daily_processing_logs
FOR ALL
USING (EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_id = auth.uid() 
  AND role IN ('admin', 'owner')
));

CREATE POLICY "System can insert processing logs"
ON public.daily_processing_logs
FOR INSERT
WITH CHECK (true);

CREATE POLICY "System can update processing logs"
ON public.daily_processing_logs
FOR UPDATE
USING (true);

-- Create updated_at trigger
CREATE TRIGGER update_daily_processing_logs_updated_at
BEFORE UPDATE ON public.daily_processing_logs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for efficient querying
CREATE INDEX idx_daily_processing_logs_date ON public.daily_processing_logs(processing_date);
CREATE INDEX idx_daily_processing_logs_status ON public.daily_processing_logs(status);

-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create the cron job for 2pm daily
SELECT cron.schedule(
  'daily-lesson-processing',
  '0 14 * * *', -- 2pm daily
  $$
  SELECT net.http_post(
    url := 'https://sjxbxkpegcnnfjbsxazo.supabase.co/functions/v1/daily-lesson-processing',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqeGJ4a3BlZ2NubmZqYnN4YXpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3MTE2NzIsImV4cCI6MjA2MzI4NzY3Mn0.QFNyi5omwRMPiL_nJlUOHo5ATwXd14PdQHfoG7oTnwA"}'::jsonb,
    body := '{"action": "process_daily_lessons"}'::jsonb
  ) as request_id;
  $$
);