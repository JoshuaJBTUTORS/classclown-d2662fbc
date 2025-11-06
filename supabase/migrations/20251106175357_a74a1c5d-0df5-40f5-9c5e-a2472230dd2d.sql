-- Extend profiles table with education data
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS region TEXT CHECK (region IN ('england', 'scotland', 'wales')),
ADD COLUMN IF NOT EXISTS curriculum TEXT CHECK (curriculum IN ('english', 'scottish', 'welsh')),
ADD COLUMN IF NOT EXISTS year_group_id UUID REFERENCES year_groups(id),
ADD COLUMN IF NOT EXISTS preferred_subjects TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMP WITH TIME ZONE;

-- Create user_courses junction table
CREATE TABLE IF NOT EXISTS user_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_auto_generated BOOLEAN DEFAULT false,
  source TEXT CHECK (source IN ('onboarding', 'manual', 'recommendation')),
  last_accessed_at TIMESTAMP WITH TIME ZONE,
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, course_id)
);

CREATE INDEX IF NOT EXISTS idx_user_courses_user ON user_courses(user_id);
CREATE INDEX IF NOT EXISTS idx_user_courses_course ON user_courses(course_id);

-- RLS policies for user_courses
ALTER TABLE user_courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own enrollments"
  ON user_courses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can enroll themselves"
  ON user_courses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own enrollments"
  ON user_courses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all enrollments"
  ON user_courses FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- Extend courses table
ALTER TABLE courses
ADD COLUMN IF NOT EXISTS is_ai_generated BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS year_group_id UUID REFERENCES year_groups(id),
ADD COLUMN IF NOT EXISTS generation_status TEXT CHECK (generation_status IN ('shell', 'generating', 'completed')) DEFAULT 'shell',
ADD COLUMN IF NOT EXISTS curriculum TEXT CHECK (curriculum IN ('english', 'scottish', 'welsh'));

-- Create curriculum_year_groups mapping table
CREATE TABLE IF NOT EXISTS curriculum_year_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year_group_id UUID REFERENCES year_groups(id) ON DELETE CASCADE,
  curriculum TEXT CHECK (curriculum IN ('english', 'scottish', 'welsh')) NOT NULL,
  display_name TEXT NOT NULL,
  national_curriculum_level TEXT,
  age_range TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(year_group_id, curriculum)
);

-- Enable RLS on curriculum_year_groups
ALTER TABLE curriculum_year_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view curriculum year groups"
  ON curriculum_year_groups FOR SELECT
  USING (true);

-- Populate curriculum_year_groups with initial data
INSERT INTO curriculum_year_groups (year_group_id, curriculum, display_name, national_curriculum_level, age_range)
SELECT 
  yg.id,
  'english' as curriculum,
  yg.name as display_name,
  CASE 
    WHEN yg.name IN ('Year 1', 'Year 2') THEN 'KS1'
    WHEN yg.name IN ('Year 3', 'Year 4', 'Year 5', 'Year 6') THEN 'KS2'
    WHEN yg.name IN ('Year 7', 'Year 8', 'Year 9') THEN 'KS3'
    WHEN yg.name IN ('Year 10', 'Year 11') THEN 'GCSE'
    WHEN yg.name IN ('Year 12', 'Year 13') THEN 'A-Level'
    ELSE NULL
  END as national_curriculum_level,
  CASE 
    WHEN yg.name = 'Year 1' THEN '5-6 years'
    WHEN yg.name = 'Year 2' THEN '6-7 years'
    WHEN yg.name = 'Year 3' THEN '7-8 years'
    WHEN yg.name = 'Year 4' THEN '8-9 years'
    WHEN yg.name = 'Year 5' THEN '9-10 years'
    WHEN yg.name = 'Year 6' THEN '10-11 years'
    WHEN yg.name = 'Year 7' THEN '11-12 years'
    WHEN yg.name = 'Year 8' THEN '12-13 years'
    WHEN yg.name = 'Year 9' THEN '13-14 years'
    WHEN yg.name = 'Year 10' THEN '14-15 years'
    WHEN yg.name = 'Year 11' THEN '15-16 years'
    WHEN yg.name = 'Year 12' THEN '16-17 years'
    WHEN yg.name = 'Year 13' THEN '17-18 years'
    ELSE NULL
  END as age_range
FROM year_groups yg
WHERE NOT EXISTS (
  SELECT 1 FROM curriculum_year_groups cyg 
  WHERE cyg.year_group_id = yg.id AND cyg.curriculum = 'english'
)
ON CONFLICT (year_group_id, curriculum) DO NOTHING;