-- Add flashcard metadata columns to course_notes table
ALTER TABLE course_notes 
ADD COLUMN IF NOT EXISTS difficulty TEXT DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_reviewed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS mastery_level INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS note_type TEXT DEFAULT 'note';

-- Create lesson_completion_badges table for tracking achievements
CREATE TABLE IF NOT EXISTS lesson_completion_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES course_lessons(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES cleo_conversations(id) ON DELETE CASCADE,
  badge_type TEXT NOT NULL,
  badge_name TEXT NOT NULL,
  badge_emoji TEXT,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE lesson_completion_badges ENABLE ROW LEVEL SECURITY;

-- Users can view their own badges
CREATE POLICY "Users can view their own badges"
ON lesson_completion_badges
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own badges
CREATE POLICY "Users can insert their own badges"
ON lesson_completion_badges
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create index for faster badge queries
CREATE INDEX IF NOT EXISTS idx_lesson_completion_badges_user_lesson 
ON lesson_completion_badges(user_id, lesson_id);

CREATE INDEX IF NOT EXISTS idx_lesson_completion_badges_conversation 
ON lesson_completion_badges(conversation_id);