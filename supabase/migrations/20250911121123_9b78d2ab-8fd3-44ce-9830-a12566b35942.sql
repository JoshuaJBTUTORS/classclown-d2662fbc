-- Add new subjects for Geography, Business, and Economics
INSERT INTO public.subjects (name, category, description) VALUES
  ('KS3 Geography', 'secondary', 'Key Stage 3 Geography for ages 11-14'),
  ('GCSE Geography', 'gcse', 'GCSE Geography preparation'),
  ('A-level Geography', 'a_level', 'A-level Geography advanced studies'),
  ('GCSE Business', 'gcse', 'GCSE Business Studies preparation'),
  ('A-level Business', 'a_level', 'A-level Business Studies advanced studies'),
  ('GCSE Economics', 'gcse', 'GCSE Economics preparation'),
  ('A-level Economics', 'a_level', 'A-level Economics advanced studies')
ON CONFLICT (name) DO NOTHING;