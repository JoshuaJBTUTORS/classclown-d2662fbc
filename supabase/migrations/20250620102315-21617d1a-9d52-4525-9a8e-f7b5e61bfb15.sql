
-- Add Agora.io fields to the lessons table
ALTER TABLE public.lessons 
ADD COLUMN agora_channel_name text,
ADD COLUMN agora_token text,
ADD COLUMN agora_uid integer,
ADD COLUMN agora_rtm_token text,
ADD COLUMN agora_whiteboard_token text,
ADD COLUMN agora_recording_id text,
ADD COLUMN agora_recording_status text DEFAULT 'not_started';

-- Create index for efficient Agora channel queries
CREATE INDEX idx_lessons_agora_channel ON public.lessons(agora_channel_name) WHERE agora_channel_name IS NOT NULL;

-- Create index for Agora UID queries
CREATE INDEX idx_lessons_agora_uid ON public.lessons(agora_uid) WHERE agora_uid IS NOT NULL;

-- Update existing lessons to support agora provider
UPDATE public.lessons 
SET video_conference_provider = 'agora' 
WHERE video_conference_provider IS NULL AND agora_channel_name IS NOT NULL;
