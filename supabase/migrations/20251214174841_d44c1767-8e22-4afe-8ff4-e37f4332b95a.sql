-- Update assessments created on Dec 13-14, 2024 to add "- Winter Term Exam" suffix
UPDATE ai_assessments 
SET title = TRIM(title) || ' - Winter Term Exam',
    updated_at = NOW()
WHERE id IN (
  'b3fd14c5-e00f-489b-8971-2cc4933f6f76',  -- 11 PLUS VR
  'a475f040-a67b-40b7-b422-5f5ca46fab63',  -- 11 Plus Maths
  'ba094c52-3882-4b83-bd13-492b64e3b1d8',  -- 11 PLUS English
  '03cc99ad-49cf-41db-9633-742a43824ddd',  -- KS3 English
  'ddde5df5-440e-469c-b0ce-8eaf716c004d',  -- KS2 English
  '676d29d8-fc26-4ab2-a2e4-d9516686057f',  -- GCSE English Language
  '3abe1249-f8b3-4882-9100-edf50710d9c5',  -- KS2 Maths
  '61fa134d-6a97-48ca-ad5b-27abca65c17f',  -- GCSE Combine Science
  '33895781-6700-418e-b42f-edb6d0b62331',  -- KS3 Science
  '1e7e71ca-da12-4650-ad80-b3691f00dafa',  -- KS3 Maths
  'f8e31163-e2b2-4149-8016-03aa141fbcd4',  -- GCSE Computer Science
  '5764c4cc-14a5-4b4a-93eb-c1ab48888ea8',  -- Gcse Physics paper 1
  '67e347c6-855f-433c-be21-1e96b72369ab',  -- GCSE Biology Paper 1
  '0dd7de16-d0d8-422d-adbe-4945fab2af2f'   -- GCSE Maths Paper 1 ( Non calculator )
);