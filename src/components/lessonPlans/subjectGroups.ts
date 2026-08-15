export interface SubjectGroupDef {
  id: string;
  label: string;
  /** Returns true when a subject name belongs to this group. */
  match: (subject: string) => boolean;
}

const startsWith = (prefix: string) => (subject: string) =>
  subject.trim().toLowerCase().startsWith(prefix.toLowerCase());

/** Ordered curriculum groups. "Other" is the implicit fallback bucket. */
export const SUBJECT_GROUPS: SubjectGroupDef[] = [
  { id: 'eleven-plus', label: '11 Plus', match: startsWith('11 plus') },
  { id: 'ks2', label: 'KS2', match: startsWith('ks2') },
  { id: 'ks3', label: 'KS3', match: startsWith('ks3') },
  { id: 'gcse', label: 'GCSE', match: startsWith('gcse') },
];

export const OTHER_GROUP_ID = 'other';
export const OTHER_GROUP_LABEL = 'Other';

export function getGroupId(subject: string): string {
  return SUBJECT_GROUPS.find((g) => g.match(subject))?.id ?? OTHER_GROUP_ID;
}

export interface GroupedSubjects<T> {
  id: string;
  label: string;
  items: T[];
}

/** Buckets items into curriculum groups, preserving group order and dropping empty groups. */
export function groupSubjects<T>(items: T[], getSubject: (item: T) => string): GroupedSubjects<T>[] {
  const buckets = new Map<string, T[]>();
  items.forEach((item) => {
    const id = getGroupId(getSubject(item));
    const existing = buckets.get(id);
    if (existing) existing.push(item);
    else buckets.set(id, [item]);
  });

  const ordered: GroupedSubjects<T>[] = SUBJECT_GROUPS.filter((g) => buckets.get(g.id)?.length).map((g) => ({
    id: g.id,
    label: g.label,
    items: buckets.get(g.id) as T[],
  }));

  const other = buckets.get(OTHER_GROUP_ID);
  if (other?.length) {
    ordered.push({ id: OTHER_GROUP_ID, label: OTHER_GROUP_LABEL, items: other });
  }

  return ordered;
}
