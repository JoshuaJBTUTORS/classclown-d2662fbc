-- Add video_type enum and columns to content_calendar
CREATE TYPE public.video_type AS ENUM ('educational', 'motivational');

-- Add new columns to content_calendar
ALTER TABLE public.content_calendar 
  ADD COLUMN video_type public.video_type DEFAULT 'educational',
  ADD COLUMN is_open_assignment boolean DEFAULT false;

-- Classify existing videos based on video_number pattern
-- Videos 1, 4, 7, 10 (video_number % 3 === 1) are motivational
UPDATE public.content_calendar
SET 
  video_type = CASE 
    WHEN video_number % 3 = 1 THEN 'motivational'::video_type
    ELSE 'educational'::video_type
  END,
  is_open_assignment = CASE 
    WHEN video_number % 3 = 1 THEN true
    ELSE false
  END;

-- Set assigned_tutor_id to NULL for motivational videos that are planned
UPDATE public.content_calendar
SET assigned_tutor_id = NULL
WHERE video_type = 'motivational' 
  AND status = 'planned'
  AND is_open_assignment = true;

-- Add index for faster queries on open assignments
CREATE INDEX idx_content_calendar_open_assignment 
  ON public.content_calendar(is_open_assignment, status, video_type) 
  WHERE is_open_assignment = true;

-- Update RLS policies for content_calendar to allow tutors to view open videos
CREATE POLICY "Content tutors can view open motivational videos"
ON public.content_calendar
FOR SELECT
TO authenticated
USING (
  is_open_assignment = true 
  AND status = 'planned' 
  AND video_type = 'motivational'
);

-- Allow tutors to claim open videos (update assigned_tutor_id)
CREATE POLICY "Content tutors can claim open videos"
ON public.content_calendar
FOR UPDATE
TO authenticated
USING (
  is_open_assignment = true 
  AND status = 'planned' 
  AND assigned_tutor_id IS NULL
  AND video_type = 'motivational'
  AND EXISTS (
    SELECT 1 FROM public.content_tutors ct
    WHERE ct.tutor_id = get_current_user_tutor_id()
      AND ct.is_active = true
  )
)
WITH CHECK (
  is_open_assignment = true 
  AND video_type = 'motivational'
  AND assigned_tutor_id = get_current_user_tutor_id()
);