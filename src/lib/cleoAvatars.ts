import cleo1 from '@/assets/avatars/cleo-1.png';
import cleo2 from '@/assets/avatars/cleo-2.png';
import cleo3 from '@/assets/avatars/cleo-3.png';
import cleo4 from '@/assets/avatars/cleo-4.png';

export type CleoAvatarKey = 'cleo-1' | 'cleo-2' | 'cleo-3' | 'cleo-4';

export const CLEO_AVATARS: { key: CleoAvatarKey; label: string; src: string }[] = [
  { key: 'cleo-1', label: 'Cleo Classic', src: cleo1 },
  { key: 'cleo-2', label: 'Cleo Specs', src: cleo2 },
  { key: 'cleo-3', label: 'Cleo Grad', src: cleo3 },
  { key: 'cleo-4', label: 'Cleo Tunes', src: cleo4 },
];

/**
 * Resolve a stored avatar_url value into a renderable image source.
 * Returns null when the user is on the default (initials) icon.
 */
export const resolveAvatarSrc = (value?: string | null): string | null => {
  if (!value) return null;
  const match = CLEO_AVATARS.find((a) => a.key === value);
  if (match) return match.src;
  if (value.startsWith('http') || value.startsWith('/') || value.startsWith('data:')) return value;
  return null;
};
