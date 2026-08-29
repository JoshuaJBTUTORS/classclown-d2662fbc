/** Shared subject level ordering + pastel tone mapping (A-level downwards). */

const levelRank = (subject: string): number => {
  const s = (subject ?? '').trim().toLowerCase();
  if (s.startsWith('a-level') || s.startsWith('a level')) return 0;
  if (s.startsWith('gcse') || s.startsWith('year 11')) return 1;
  if (s.startsWith('ks3')) return 2;
  if (s.startsWith('early ks2') || s.startsWith('ks2') || s.startsWith('sats')) return 3;
  if (s.startsWith('11 plus') || s.startsWith('11+')) return 4;
  return 5;
};

/** A-level → GCSE/Year 11 → KS3 → KS2/Sats → 11 Plus → Other, alphabetical within each. */
export const sortSubjectsByLevel = <T,>(items: T[], getName: (item: T) => string): T[] =>
  [...items].sort((a, b) => {
    const ra = levelRank(getName(a));
    const rb = levelRank(getName(b));
    if (ra !== rb) return ra - rb;
    return getName(a).localeCompare(getName(b));
  });

export const sortSubjectNames = (subjects: string[]): string[] =>
  sortSubjectsByLevel(subjects, (s) => s);

/** Stable pastel tone per subject category (matches calendar year-group colouring). */
export const getSubjectCategoryTone = (subject: string): string => {
  const s = (subject ?? '').trim().toLowerCase();
  if (s.startsWith('11 plus') || s.startsWith('11+')) return 'bg-pastel-lilac';
  if (s.startsWith('early ks2') || s.startsWith('ks2') || s.startsWith('sats')) return 'bg-pastel-mint';
  if (s.startsWith('ks3')) return 'bg-pastel-sky';
  if (s.startsWith('gcse') || s.startsWith('year 11')) return 'bg-pastel-butter';
  if (s.startsWith('a-level') || s.startsWith('a level')) return 'bg-pastel-blush';
  return 'bg-pastel-sand';
};

export const subjectLevelRank = levelRank;
