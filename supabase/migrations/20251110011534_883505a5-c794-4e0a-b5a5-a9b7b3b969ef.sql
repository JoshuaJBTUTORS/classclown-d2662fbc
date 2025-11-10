-- Add exam board fields to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS education_level TEXT CHECK (education_level IN ('11_plus', 'gcse'));

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS gcse_subject_ids UUID[] DEFAULT '{}';

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS exam_boards JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN profiles.exam_boards IS 'Maps subject IDs to exam boards, e.g. {"uuid-1": "AQA", "uuid-2": "Edexcel"}';

-- Add subject_id to cleo_conversations
ALTER TABLE cleo_conversations
ADD COLUMN IF NOT EXISTS subject_id UUID REFERENCES subjects(id);

-- Create exam board specifications table
CREATE TABLE IF NOT EXISTS exam_board_specifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  exam_board TEXT NOT NULL CHECK (exam_board IN ('AQA', 'Edexcel', 'OCR', 'WJEC', 'Cambridge', 'CCEA', 'Eduqas')),
  
  -- Document info
  title TEXT NOT NULL,
  description TEXT,
  document_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size_bytes INTEGER,
  mime_type TEXT,
  
  -- Content for AI context
  extracted_text TEXT,
  summary TEXT,
  key_topics JSONB DEFAULT '[]'::jsonb,
  
  -- Metadata
  specification_year INTEGER,
  version TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'draft')),
  
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_exam_board_specs_subject ON exam_board_specifications(subject_id);
CREATE INDEX IF NOT EXISTS idx_exam_board_specs_board ON exam_board_specifications(exam_board);
CREATE INDEX IF NOT EXISTS idx_exam_board_specs_status ON exam_board_specifications(status);

-- RLS Policies for exam_board_specifications
ALTER TABLE exam_board_specifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage exam board specifications" ON exam_board_specifications;
CREATE POLICY "Admins can manage exam board specifications"
  ON exam_board_specifications
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role IN ('admin', 'owner')
    )
  );

DROP POLICY IF EXISTS "Users can view active specifications" ON exam_board_specifications;
CREATE POLICY "Users can view active specifications"
  ON exam_board_specifications
  FOR SELECT
  USING (status = 'active' AND auth.role() = 'authenticated');

-- Create storage bucket for specifications
INSERT INTO storage.buckets (id, name, public)
VALUES ('exam-board-specifications', 'exam-board-specifications', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
DROP POLICY IF EXISTS "Admins can upload specifications" ON storage.objects;
CREATE POLICY "Admins can upload specifications"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'exam-board-specifications'
    AND EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role IN ('admin', 'owner')
    )
  );

DROP POLICY IF EXISTS "Admins can manage specification files" ON storage.objects;
CREATE POLICY "Admins can manage specification files"
  ON storage.objects
  FOR ALL
  USING (
    bucket_id = 'exam-board-specifications'
    AND EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role IN ('admin', 'owner')
    )
  );

DROP POLICY IF EXISTS "Users can download specifications" ON storage.objects;
CREATE POLICY "Users can download specifications"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'exam-board-specifications'
    AND auth.role() = 'authenticated'
  );