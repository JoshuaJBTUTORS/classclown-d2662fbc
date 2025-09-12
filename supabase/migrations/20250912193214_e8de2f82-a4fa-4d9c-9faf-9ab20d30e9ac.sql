-- Add GCSE Computer Science to subjects table
INSERT INTO public.subjects (name, category, description)
VALUES ('GCSE Computer Science', 'gcse', 'GCSE Computer Science preparation')
ON CONFLICT (name) DO NOTHING;