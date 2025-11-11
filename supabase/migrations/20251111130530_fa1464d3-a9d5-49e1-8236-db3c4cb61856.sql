-- Create GCSE Maths Course with Module Structure
-- This adds a new published course that will automatically appear for users who selected GCSE Maths in their learning preferences

-- Insert the GCSE Maths course
INSERT INTO courses (
  title,
  subject,
  description,
  status,
  generation_status,
  difficulty_level,
  is_free_for_all
) VALUES (
  'GCSE Maths',
  'Maths',
  'Master GCSE Mathematics with comprehensive coverage of all exam topics. From algebra and geometry to statistics and probability, build a strong foundation for exam success.',
  'published',
  'shell',
  'gcse',
  false
);

-- Get the course ID for module creation
DO $$
DECLARE
  v_course_id uuid;
  v_getting_started_module_id uuid;
BEGIN
  -- Get the course ID we just created
  SELECT id INTO v_course_id FROM courses WHERE title = 'GCSE Maths' AND subject = 'Maths' LIMIT 1;

  -- Insert modules for the course
  INSERT INTO course_modules (course_id, title, description, position) VALUES
    (v_course_id, 'Getting Started', 'Introduction to GCSE Maths and key concepts', 0),
    (v_course_id, 'Number and Algebra', 'Master number operations, equations, and algebraic manipulation', 1),
    (v_course_id, 'Ratio, Proportion and Rates of Change', 'Understand ratios, percentages, and proportional relationships', 2),
    (v_course_id, 'Geometry and Measures', 'Explore shapes, angles, area, volume, and trigonometry', 3),
    (v_course_id, 'Probability and Statistics', 'Learn data handling, probability, and statistical analysis', 4),
    (v_course_id, 'Assessment and Practice', 'Exam preparation and practice papers', 5);

  -- Get the Getting Started module ID
  SELECT id INTO v_getting_started_module_id 
  FROM course_modules 
  WHERE course_id = v_course_id AND title = 'Getting Started';

  -- Insert a preview lesson in Getting Started module
  INSERT INTO course_lessons (
    module_id,
    title,
    description,
    content_type,
    content_text,
    position,
    duration_minutes,
    is_preview
  ) VALUES (
    v_getting_started_module_id,
    'Welcome to GCSE Maths',
    'Get started with your GCSE Maths journey and understand what to expect',
    'text',
    'Welcome to GCSE Maths! This comprehensive course covers all topics required for GCSE Mathematics across all major exam boards (AQA, Edexcel, OCR).

## What You''ll Learn

Throughout this course, you''ll master:
- **Number and Algebra**: From basic operations to complex algebraic manipulation
- **Ratio, Proportion and Rates of Change**: Understanding relationships between quantities
- **Geometry and Measures**: Shapes, angles, area, volume, and trigonometry
- **Probability and Statistics**: Data handling and statistical analysis

## How to Use This Course

Each module is structured to build your understanding progressively. Work through the lessons in order, practice with exercises, and use Cleo''s voice tutor to get personalized help whenever you need it.

## Exam Preparation

The final module provides targeted exam practice, helping you apply everything you''ve learned to achieve your best possible grade.

Let''s get started! 📐',
    0,
    5,
    true
  );
END $$;