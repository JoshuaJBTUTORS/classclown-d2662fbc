-- Make subject column nullable (content is now subject-agnostic)
ALTER TABLE public.content_calendar 
ALTER COLUMN subject DROP NOT NULL;

-- Update unique constraint to use week/video numbering instead of subject
ALTER TABLE public.content_calendar 
DROP CONSTRAINT IF EXISTS content_calendar_subject_month_title_key;

ALTER TABLE public.content_calendar 
ADD CONSTRAINT content_calendar_month_week_video_unique 
UNIQUE (month, week_number, video_number);

-- Set better defaults for the new structure
ALTER TABLE public.content_calendar 
ALTER COLUMN is_open_assignment SET DEFAULT true;

ALTER TABLE public.content_calendar 
ALTER COLUMN subject SET DEFAULT NULL;

-- Add comment explaining the new structure
COMMENT ON TABLE public.content_calendar IS 'Content calendar organized by week (1-52) with 6-7 videos per week. Subject is optional. Videos are open for any tutor to claim unless marked otherwise.';