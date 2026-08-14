export interface PastelTone {
  bg: string;
  text: string;
  chip: string;
  bar: string;
}

const TONES: PastelTone[] = [
  { bg: 'bg-pastel-mint', text: 'text-pastel-mint-foreground', chip: 'bg-background/60 text-pastel-mint-foreground', bar: 'bg-pastel-mint-foreground' },
  { bg: 'bg-pastel-lilac', text: 'text-pastel-lilac-foreground', chip: 'bg-background/60 text-pastel-lilac-foreground', bar: 'bg-pastel-lilac-foreground' },
  { bg: 'bg-pastel-butter', text: 'text-pastel-butter-foreground', chip: 'bg-background/60 text-pastel-butter-foreground', bar: 'bg-pastel-butter-foreground' },
  { bg: 'bg-pastel-blush', text: 'text-pastel-blush-foreground', chip: 'bg-background/60 text-pastel-blush-foreground', bar: 'bg-pastel-blush-foreground' },
  { bg: 'bg-pastel-sky', text: 'text-pastel-sky-foreground', chip: 'bg-background/60 text-pastel-sky-foreground', bar: 'bg-pastel-sky-foreground' },
  { bg: 'bg-pastel-sand', text: 'text-pastel-sand-foreground', chip: 'bg-background/60 text-pastel-sand-foreground', bar: 'bg-pastel-sand-foreground' },
];

/** Stable pastel tone per subject name so colours never shuffle between renders. */
export const getPastelTone = (subject: string): PastelTone => {
  let hash = 0;
  for (let i = 0; i < subject.length; i++) {
    hash = (hash * 31 + subject.charCodeAt(i)) % 997;
  }
  return TONES[hash % TONES.length];
};

export const pastelTones = TONES;
