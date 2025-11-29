-- Add new columns for tracking resume state
ALTER TABLE public.cleo_lesson_state
ADD COLUMN IF NOT EXISTS last_step_title TEXT,
ADD COLUMN IF NOT EXISTS last_content_block_id TEXT,
ADD COLUMN IF NOT EXISTS last_cleo_message TEXT;