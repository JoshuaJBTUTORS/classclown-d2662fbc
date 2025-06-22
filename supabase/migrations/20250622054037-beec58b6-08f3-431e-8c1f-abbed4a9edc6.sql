
-- Add missing columns for Flexible Classroom support to the lessons table
ALTER TABLE public.lessons 
ADD COLUMN flexible_classroom_room_id text,
ADD COLUMN flexible_classroom_session_data jsonb;

-- Add comments to document the new columns
COMMENT ON COLUMN public.lessons.flexible_classroom_room_id IS 'Room ID for Agora Flexible Classroom sessions';
COMMENT ON COLUMN public.lessons.flexible_classroom_session_data IS 'JSON data containing Flexible Classroom session credentials and metadata';
