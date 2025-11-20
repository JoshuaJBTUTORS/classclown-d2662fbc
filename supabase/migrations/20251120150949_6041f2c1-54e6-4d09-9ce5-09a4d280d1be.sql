-- Add separate GCSE English Language and Literature subjects
INSERT INTO subjects (id, name, category, description) VALUES
  (gen_random_uuid(), 'GCSE English Language', 'gcse', 'GCSE English Language - focused on reading and writing skills, analyzing texts, and creative/transactional writing'),
  (gen_random_uuid(), 'GCSE English Literature', 'gcse', 'GCSE English Literature - focused on analyzing literary texts including novels, plays, and poetry')
ON CONFLICT DO NOTHING;

-- Update any existing exam board specifications that reference the old "GCSE English" to English Language
UPDATE exam_board_specifications 
SET subject_id = (SELECT id FROM subjects WHERE name = 'GCSE English Language' LIMIT 1)
WHERE subject_id = (SELECT id FROM subjects WHERE name = 'GCSE English' LIMIT 1);