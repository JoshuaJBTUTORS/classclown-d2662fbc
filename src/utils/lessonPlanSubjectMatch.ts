/**
 * Maps calendar lesson subject names onto the subject names used in the
 * `lesson_plans` library. Matching is case/whitespace insensitive and goes
 * through an alias table for known naming mismatches.
 */

const ALIASES: Record<string, string> = {
  // 11 Plus
  '11 plus nvr': '11 Plus Non-Verbal Reasoning',
  '11 plus non verbal reasoning': '11 Plus Non-Verbal Reasoning',
  '11 plus vr': '11 Plus Verbal Reasoning',

  // KS3 (plan library stores lowercase variants)
  'ks3 maths': 'KS3 maths',
  'ks3 science': 'KS3 science',

  // GCSE maths tiers
  'gcse maths highier': 'GCSE Maths',
  'gcse maths higher': 'GCSE Maths',
  'gcse maths foundation': 'GCSE Maths',
  'year 11 maths highier': 'GCSE Maths',
  'year 11 maths higher': 'GCSE Maths',
  'year 11 maths foundation': 'GCSE Maths',

  // Year 11 -> GCSE
  'year 11 combined science': 'GCSE Combined Science',
  'year 11 english': 'GCSE English',
  'year 11 chemistry': 'GCSE Chemistry',
  'year 11 physics': 'GCSE Physics',
  'year 11 biology': 'GCSE Biology',
  'gcse english language': 'GCSE English',
  'gcse english literature': 'GCSE English',

  // KS2 variants
  'sats english': 'KS2 English',
  'sats maths': 'KS2 Maths',
  'early ks2 english': 'KS2 English',
  'early ks2 maths': 'KS2 Maths',
};

export function normaliseSubject(subject: string): string {
  return subject.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Returns the lesson_plans subject name to look up for a given lesson subject.
 */
export function resolvePlanSubject(subject: string | null | undefined): string | null {
  if (!subject) return null;
  const key = normaliseSubject(subject);
  return ALIASES[key] ?? subject.trim();
}
