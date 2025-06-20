
-- Add Netless whiteboard fields to the lessons table
ALTER TABLE public.lessons 
ADD COLUMN IF NOT EXISTS netless_room_uuid TEXT,
ADD COLUMN IF NOT EXISTS netless_room_token TEXT,
ADD COLUMN IF NOT EXISTS netless_app_identifier TEXT;

-- Add index for better performance on room lookups
CREATE INDEX IF NOT EXISTS idx_lessons_netless_room_uuid ON public.lessons(netless_room_uuid);
