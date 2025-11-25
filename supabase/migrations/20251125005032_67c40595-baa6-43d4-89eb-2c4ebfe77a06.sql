-- Enable REPLICA IDENTITY FULL for real-time UPDATE events to work properly
-- This ensures full row data is captured when app_version is updated
ALTER TABLE public.app_settings REPLICA IDENTITY FULL;