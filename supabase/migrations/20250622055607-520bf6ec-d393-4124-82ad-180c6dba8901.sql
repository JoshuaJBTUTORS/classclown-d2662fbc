
-- Remove all old video conferencing columns from lessons table, keeping only Flexible Classroom
ALTER TABLE public.lessons 
DROP COLUMN IF EXISTS lesson_space_room_id,
DROP COLUMN IF EXISTS lesson_space_room_url,
DROP COLUMN IF EXISTS lesson_space_space_id,
DROP COLUMN IF EXISTS lesson_space_session_id,
DROP COLUMN IF EXISTS video_conference_provider,
DROP COLUMN IF EXISTS video_conference_link,
DROP COLUMN IF EXISTS agora_channel_name,
DROP COLUMN IF EXISTS agora_token,
DROP COLUMN IF EXISTS agora_uid,
DROP COLUMN IF EXISTS agora_rtm_token,
DROP COLUMN IF EXISTS agora_whiteboard_token,
DROP COLUMN IF EXISTS agora_recording_id,
DROP COLUMN IF EXISTS agora_recording_status,
DROP COLUMN IF EXISTS netless_room_uuid,
DROP COLUMN IF EXISTS netless_room_token,
DROP COLUMN IF EXISTS netless_app_identifier;

-- Remove lesson_space_url from lesson_students table
ALTER TABLE public.lesson_students 
DROP COLUMN IF EXISTS lesson_space_url;

-- Add comment to document the simplified approach
COMMENT ON COLUMN public.lessons.flexible_classroom_room_id IS 'Room ID for Agora Flexible Classroom - the only video conferencing option';
COMMENT ON COLUMN public.lessons.flexible_classroom_session_data IS 'Session credentials and metadata for Agora Flexible Classroom';
