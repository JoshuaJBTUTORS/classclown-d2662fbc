-- Add fields to track transcript processing metadata and chunking
ALTER TABLE public.lesson_transcriptions ADD COLUMN IF NOT EXISTS 
  transcript_size_bytes INTEGER DEFAULT NULL;

ALTER TABLE public.lesson_transcriptions ADD COLUMN IF NOT EXISTS 
  processing_attempts INTEGER DEFAULT 0;

ALTER TABLE public.lesson_transcriptions ADD COLUMN IF NOT EXISTS 
  chunk_count INTEGER DEFAULT 1;

ALTER TABLE public.lesson_transcriptions ADD COLUMN IF NOT EXISTS 
  chunk_processing_status JSONB DEFAULT '{}';

ALTER TABLE public.lesson_transcriptions ADD COLUMN IF NOT EXISTS 
  processing_notes TEXT DEFAULT NULL;

ALTER TABLE public.lesson_transcriptions ADD COLUMN IF NOT EXISTS 
  last_processing_error TEXT DEFAULT NULL;

ALTER TABLE public.lesson_transcriptions ADD COLUMN IF NOT EXISTS 
  fallback_processing_used BOOLEAN DEFAULT FALSE;

-- Add index for performance tracking
CREATE INDEX IF NOT EXISTS idx_lesson_transcriptions_processing_attempts 
ON public.lesson_transcriptions(processing_attempts);

CREATE INDEX IF NOT EXISTS idx_lesson_transcriptions_size 
ON public.lesson_transcriptions(transcript_size_bytes);