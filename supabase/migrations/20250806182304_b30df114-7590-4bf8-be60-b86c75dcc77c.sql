-- Add engagement and confidence tracking fields to student_progress table
ALTER TABLE public.student_progress 
ADD COLUMN IF NOT EXISTS engagement_score INTEGER DEFAULT NULL CHECK (engagement_score >= 0 AND engagement_score <= 10),
ADD COLUMN IF NOT EXISTS confidence_increase INTEGER DEFAULT NULL CHECK (confidence_increase >= -10 AND confidence_increase <= 10),
ADD COLUMN IF NOT EXISTS participation_metrics JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS speaking_time_minutes DECIMAL(5,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS questions_asked INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS responses_given INTEGER DEFAULT 0;

-- Add engagement and confidence metrics to lesson_student_summaries
ALTER TABLE public.lesson_student_summaries 
ADD COLUMN IF NOT EXISTS engagement_score INTEGER DEFAULT NULL CHECK (engagement_score >= 0 AND engagement_score <= 10),
ADD COLUMN IF NOT EXISTS confidence_score INTEGER DEFAULT NULL CHECK (confidence_score >= 0 AND confidence_score <= 10),
ADD COLUMN IF NOT EXISTS confidence_indicators JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS participation_time_percentage DECIMAL(5,2) DEFAULT NULL;

-- Create index for better performance on engagement queries
CREATE INDEX IF NOT EXISTS idx_student_progress_engagement ON public.student_progress(engagement_score, confidence_increase);
CREATE INDEX IF NOT EXISTS idx_lesson_summaries_engagement ON public.lesson_student_summaries(engagement_score, confidence_score);