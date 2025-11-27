-- Update Testing Course title and subject to include GCSE prefix
UPDATE courses 
SET 
  title = 'GCSE Testing Course',
  subject = 'GCSE Testing',
  updated_at = NOW()
WHERE id = 'b4dd840a-c5f1-4660-bab5-6d7a8e3826a9';