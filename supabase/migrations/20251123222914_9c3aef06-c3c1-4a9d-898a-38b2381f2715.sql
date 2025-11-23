-- Set default exam boards for all users based on available specifications

-- Update all profiles to have default exam boards for GCSE subjects
UPDATE public.profiles
SET exam_boards = jsonb_build_object(
  -- GCSE Biology: AQA
  'ea93a529-be04-4cd8-8a05-8f4666289929', 'AQA',
  -- GCSE Chemistry: AQA
  '89f3ba32-ac3a-41c3-8e14-27c24d507cd1', 'AQA',
  -- GCSE Computer Science: OCR
  '39a79117-726f-4dbb-b3c3-97c4fc64b6cf', 'OCR',
  -- GCSE English Language: AQA
  '6576381a-7b88-4d72-b787-ad625e3d8ee7', 'AQA',
  -- GCSE English Literature: AQA
  '38a6707e-6e99-438b-b73d-39296cb849b4', 'AQA',
  -- GCSE Maths: Edexcel
  '3167ae19-f809-4d8c-9589-f3778cc7f177', 'Edexcel',
  -- GCSE Physics: AQA
  '60c23889-e6af-47b7-a3b3-6e7cf96bf035', 'AQA'
)
WHERE exam_boards IS NULL OR exam_boards = '{}'::jsonb;

-- Also merge with existing exam_boards for users who have some but not all
UPDATE public.profiles
SET exam_boards = COALESCE(exam_boards, '{}'::jsonb) || jsonb_build_object(
  'ea93a529-be04-4cd8-8a05-8f4666289929', 'AQA',
  '89f3ba32-ac3a-41c3-8e14-27c24d507cd1', 'AQA',
  '39a79117-726f-4dbb-b3c3-97c4fc64b6cf', 'OCR',
  '6576381a-7b88-4d72-b787-ad625e3d8ee7', 'AQA',
  '38a6707e-6e99-438b-b73d-39296cb849b4', 'AQA',
  '3167ae19-f809-4d8c-9589-f3778cc7f177', 'Edexcel',
  '60c23889-e6af-47b7-a3b3-6e7cf96bf035', 'AQA'
)
WHERE exam_boards IS NOT NULL AND exam_boards != '{}'::jsonb;