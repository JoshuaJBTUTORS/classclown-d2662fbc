
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
  'KS3 Geography',
  'GCSE Maths Highier',
  'GCSE Maths Foundation',
  'GCSE English',
  'GCSE Combined Science',
  'GCSE Computer Science',
  'GCSE Geography',
  'GCSE Business',
  'GCSE Economics',
  'Year 11 Maths Highier',
  'Year 11 Maths Foundation',
  'Year 11 English',
  'Year 11 Combined Science',
  'GCSE Physics',
  'GCSE Chemistry',
  'GCSE Biology',
  'Year 11 Physics',
  'Year 11 Biology',
  'Year 11 Chemistry',
  'A-level Maths',
  'A-level Biology',
  'A-level Chemistry',
  'A-level Physics',
  'A-level Computer Science',
  'A-level Geography',
  'A-level Business',
  'A-level Economics'
] as const;

export type LessonSubject = typeof LESSON_SUBJECTS[number];

// Educational stage categories for better organization - removed as const from subjects arrays
export const EDUCATIONAL_STAGES = {
  '11_plus': {
    label: '11 Plus',
    description: 'Preparation for grammar school entrance',
    subjects: ['11 Plus Maths', '11 Plus English', '11 Plus VR', '11 Plus NVR'],
    icon: 'GraduationCap'
  },
  'ks2': {
    label: 'Key Stage 2',
    description: 'Ages 7-11 primary education',
    subjects: ['Early KS2 Maths', 'Early KS2 English', 'KS2 Maths', 'KS2 English', 'Sats Maths', 'Sats English'],
    icon: 'BookOpen'
  },
  'ks3': {
    label: 'Key Stage 3',
    description: 'Ages 11-14 secondary education',
    subjects: ['KS3 Maths', 'KS3 English', 'KS3 Science', 'KS3 Geography'],
    icon: 'School'
  },
  'gcse': {
    label: 'GCSE & Year 11',
    description: 'Ages 14-16 GCSE preparation',
    subjects: ['GCSE Maths', 'GCSE English', 'GCSE Combined Science', 'GCSE Computer Science', 'GCSE Geography', 'GCSE Business', 'GCSE Economics', 'Year 11 Maths', 'Year 11 English', 'Year 11 Combined Science', 'GCSE Physics', 'GCSE Chemistry', 'GCSE Biology', 'Year 11 Physics', 'Year 11 Biology', 'Year 11 Chemistry'],
    icon: 'Award'
  },
  'a_level': {
    label: 'A-Level',
    description: 'Ages 16-18 advanced level studies',
    subjects: ['A-level Maths', 'A-level Biology', 'A-level Chemistry', 'A-level Physics', 'A-level Computer Science', 'A-level Geography', 'A-level Business', 'A-level Economics'],
    icon: 'GraduationCap'
  }
} as const;

export const SUBJECT_AREAS = [
  'All Subjects',
  'Maths',
  'English', 
  'Sciences',
  'Other'
] as const;

export function getSubjectArea(subject: string): string {
  if (subject.includes('Maths')) return 'Maths';
  if (subject.includes('English')) return 'English';
  if (subject.includes('Science') || subject.includes('Physics') || subject.includes('Chemistry') || subject.includes('Biology')) return 'Sciences';
  if (subject.includes('Geography') || subject.includes('Business') || subject.includes('Economics')) return 'Other';
  return 'Other';
}

// Helper function to check if a string is a valid LessonSubject
export function isValidLessonSubject(subject: string): subject is LessonSubject {
  return LESSON_SUBJECTS.includes(subject as LessonSubject);
}
