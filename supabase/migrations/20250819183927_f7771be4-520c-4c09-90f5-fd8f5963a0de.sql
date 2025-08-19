-- Update the CHECK constraint on lessons table to allow 'demo' lesson type
ALTER TABLE public.lessons 
DROP CONSTRAINT IF EXISTS lessons_lesson_type_check;

ALTER TABLE public.lessons 
ADD CONSTRAINT lessons_lesson_type_check 
CHECK (lesson_type IN ('regular', 'trial', 'makeup', 'demo'));