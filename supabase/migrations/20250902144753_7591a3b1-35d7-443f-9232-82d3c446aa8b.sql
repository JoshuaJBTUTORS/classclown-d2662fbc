-- Insert A-Level subjects if they don't exist
INSERT INTO public.subjects (name, category, description) 
VALUES 
  ('A-level Biology', 'a_level', 'Advanced Level Biology for ages 16-18'),
  ('A-level Chemistry', 'a_level', 'Advanced Level Chemistry for ages 16-18'),
  ('A-level Physics', 'a_level', 'Advanced Level Physics for ages 16-18'),
  ('A-level Computer Science', 'a_level', 'Advanced Level Computer Science for ages 16-18')
ON CONFLICT (name) DO UPDATE SET 
  category = EXCLUDED.category,
  description = EXCLUDED.description;