
export const LESSON_SUBJECTS = [
  '11 Plus Maths',
  '11 Plus English',
  '11 Plus VR',
  '11 Plus NVR',
  'Early KS2 Maths',
  'Early KS2 English',
  'KS2 Maths',
  'KS2 English',
  'Sats Maths',
  'Sats English',
  'KS3 Maths',
  'KS3 English',
  'KS3 Science',
  'GCSE Maths',
  'GCSE English',
  'GCSE Combined Science',
  'Year 11 Maths',
  'Year 11 English',
  'Year 11 Combined Science',
  'GCSE Physics',
  'GCSE Chemistry',
  'GCSE Biology',
  'Year 11 Physics',
  'Year 11 Biology',
  'Year 11 Chemistry'
] as const;

export type LessonSubject = typeof LESSON_SUBJECTS[number];
