-- Add A-level Maths to the database with correct category
INSERT INTO public.subjects (name, category, description) 
VALUES ('A-level Maths', 'a_level', 'Advanced Level Mathematics for ages 16-18')
ON CONFLICT (name) DO UPDATE SET 
  category = EXCLUDED.category,
  description = EXCLUDED.description;