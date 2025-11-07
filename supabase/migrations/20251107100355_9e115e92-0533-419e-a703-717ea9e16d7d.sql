-- Update existing 11+ courses to be free for all
UPDATE courses 
SET is_free_for_all = true 
WHERE id IN (
  '2c40ae88-195c-4935-8824-f093e7ff3a45',  -- 11 Plus Maths
  'd6da4a2d-663a-45a3-9b55-1df8dcb39c4f',  -- 11 Plus English
  '490720a3-09b9-4dba-9cad-08d15380e5a9'   -- 11 Plus VR
);

-- Create the missing 11 Plus NVR course
INSERT INTO courses (title, subject, description, status, price, is_free_for_all, difficulty_level)
VALUES (
  '11 Plus NVR',
  '11 Plus NVR',
  'Non-Verbal Reasoning preparation for 11 Plus entrance exams. Master patterns, sequences, and spatial reasoning skills.',
  'published',
  899,
  true,
  'gcse'
);