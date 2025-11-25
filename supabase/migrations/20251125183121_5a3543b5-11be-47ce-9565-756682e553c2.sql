-- Remove voice_speed column from profiles table
ALTER TABLE public.profiles DROP COLUMN IF EXISTS voice_speed;