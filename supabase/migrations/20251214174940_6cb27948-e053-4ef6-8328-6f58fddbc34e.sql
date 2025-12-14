-- Update all Winter Term Exam assessments to published status
UPDATE ai_assessments 
SET status = 'published',
    updated_at = NOW()
WHERE id IN (
  'b3fd14c5-e00f-489b-8971-2cc4933f6f76',
  'a475f040-a67b-40b7-b422-5f5ca46fab63',
  'ba094c52-3882-4b83-bd13-492b64e3b1d8',
  '03cc99ad-49cf-41db-9633-742a43824ddd',
  'ddde5df5-440e-469c-b0ce-8eaf716c004d',
  '676d29d8-fc26-4ab2-a2e4-d9516686057f',
  '3abe1249-f8b3-4882-9100-edf50710d9c5',
  '61fa134d-6a97-48ca-ad5b-27abca65c17f',
  '33895781-6700-418e-b42f-edb6d0b62331',
  '1e7e71ca-da12-4650-ad80-b3691f00dafa',
  'f8e31163-e2b2-4149-8016-03aa141fbcd4',
  '5764c4cc-14a5-4b4a-93eb-c1ab48888ea8',
  '67e347c6-855f-433c-be21-1e96b72369ab',
  '0dd7de16-d0d8-422d-adbe-4945fab2af2f'
);