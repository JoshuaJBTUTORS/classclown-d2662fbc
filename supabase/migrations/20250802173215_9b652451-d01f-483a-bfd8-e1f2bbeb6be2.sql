-- Add lesson_space_recording_url column to lessons table
ALTER TABLE public.lessons 
ADD COLUMN lesson_space_recording_url text;