
-- Add LessonSpace integration columns to the lessons table
ALTER TABLE public.lessons 
ADD COLUMN IF NOT EXISTS lesson_space_room_id TEXT,
ADD COLUMN IF NOT EXISTS lesson_space_room_url TEXT,
ADD COLUMN IF NOT EXISTS lesson_space_space_id TEXT;

-- Add index for better performance on room lookups
CREATE INDEX IF NOT EXISTS idx_lessons_lesson_space_room_id ON public.lessons(lesson_space_room_id);

-- Add comment to document the new columns
COMMENT ON COLUMN public.lessons.lesson_space_room_id IS 'LessonSpace room ID returned from API';
COMMENT ON COLUMN public.lessons.lesson_space_room_url IS 'Teacher authenticated URL for LessonSpace room';
COMMENT ON COLUMN public.lessons.lesson_space_space_id IS 'LessonSpace space ID used for student joins';
