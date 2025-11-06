export type Region = 'england' | 'scotland' | 'wales';
export type Curriculum = 'english' | 'scottish' | 'welsh';

export interface OnboardingData {
  region: Region;
  curriculum: Curriculum;
  yearGroupId: string;
  subjects: string[];
}

export interface OnboardingProfile {
  region?: Region;
  curriculum?: Curriculum;
  yearGroupId?: string;
  preferredSubjects?: string[];
  onboardingCompleted: boolean;
  onboardingCompletedAt?: string;
}

export const AVAILABLE_SUBJECTS = [
  'Biology',
  'Chemistry',
  'Physics',
  'Maths',
  'English',
  'Computer Science',
] as const;

export type AvailableSubject = typeof AVAILABLE_SUBJECTS[number];
