-- Add discount extension field to lesson_proposals table
ALTER TABLE public.lesson_proposals 
ADD COLUMN discount_extended_until TIMESTAMP WITH TIME ZONE NULL;