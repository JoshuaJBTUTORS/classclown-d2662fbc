-- Add exam_board_specification_id column to courses table
ALTER TABLE courses 
ADD COLUMN exam_board_specification_id UUID;

-- Add foreign key constraint
ALTER TABLE courses
ADD CONSTRAINT courses_exam_board_specification_id_fkey 
FOREIGN KEY (exam_board_specification_id) 
REFERENCES exam_board_specifications(id)
ON DELETE SET NULL;

-- Backfill existing courses with their exam board specifications
UPDATE courses SET exam_board_specification_id = 'cac73e37-26bc-452f-9f21-49f70e019b7b' WHERE id = 'dcd2885d-f43a-4c9e-8f08-046e57d12e26'; -- GCSE Biology → AQA GCSE Biology
UPDATE courses SET exam_board_specification_id = '8d3ef168-491b-4e72-ae3d-7b7409b7390f' WHERE id = '34326bd0-4c00-4520-8988-3a067f17c0d2'; -- GCSE Chemistry → AQA GCSE Chemistry
UPDATE courses SET exam_board_specification_id = '98c42037-39c1-4054-9d21-acbeb22b8028' WHERE id = '86a3ac3a-feee-432c-9c07-a5934e6a9d3e'; -- GCSE English Language → AQA GCSE English Language
UPDATE courses SET exam_board_specification_id = '3d55f55f-4b89-4b50-a29b-a5e15081e676' WHERE id = '6cc72176-601c-4b1b-8fbb-25e56dda9838'; -- GCSE English Literature → AQA GCSE Literature
UPDATE courses SET exam_board_specification_id = '42742467-ce2e-46b2-b5b8-cc4c0916e6d8' WHERE id = '74e17c21-14a2-4194-8f9e-d5eba2612922'; -- GCSE Maths → Edexcel GCSE Maths
UPDATE courses SET exam_board_specification_id = '89c08cb2-737b-4bb4-8364-fed5e8f591cd' WHERE id = 'ecad6722-809f-4988-a2c0-40966d20f516'; -- GCSE Physics → AQA GCSE Physics

-- Note: 11 Plus courses, GCSE Computer Science, and A-Level Physics left as NULL (no exam board specs available)