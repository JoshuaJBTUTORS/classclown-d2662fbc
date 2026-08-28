import React from 'react';
import { cn } from '@/lib/utils';

export type TileTone = 'mint' | 'sky' | 'butter' | 'blush' | 'lilac' | 'sand';

const TONE_CLASSES: Record<TileTone, string> = {
  mint: 'bg-pastel-mint text-pastel-mint-foreground',
  sky: 'bg-pastel-sky text-pastel-sky-foreground',
  butter: 'bg-pastel-butter text-pastel-butter-foreground',
  blush: 'bg-pastel-blush text-pastel-blush-foreground',
  lilac: 'bg-pastel-lilac text-pastel-lilac-foreground',
  sand: 'bg-pastel-sand text-pastel-sand-foreground',
};

interface StatTileProps {
  label: string;
  value: string;
  caption?: string;
  tone: TileTone;
  icon?: React.ReactNode;
  /** 0-100 values rendered as a tiny inline sparkline. */
  sparkline?: number[];
}

const Sparkline: React.FC<{ points: number[] }> = ({ points }) => {
  if (points.length < 2) return null;
  const max = Math.max(...points, 1);
  const min = Math.min(...points, 0);
  const span = max - min || 1;
  const d = points
    .map((p, i) => {
      const x = (i / (points.length - 1)) * 100;
      const y = 24 - ((p - min) / span) * 20 - 2;
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <svg viewBox="0 0 100 24" preserveAspectRatio="none" aria-hidden="true" className="mt-3 h-6 w-full opacity-70">
      <path d={d} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

const StatTile: React.FC<StatTileProps> = ({ label, value, caption, tone, icon, sparkline }) => (
  <div className={cn('group rounded-[1.5rem] p-5 transition-transform duration-200 hover:-translate-y-0.5', TONE_CLASSES[tone])}>
    <div className="flex items-start justify-between gap-3">
      <p className="text-sm font-medium opacity-80">{label}</p>
      {icon && (
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-background/50 transition-transform duration-200 group-hover:rotate-6">
          {icon}
        </span>
      )}
    </div>
    <p className="mt-2 font-heading text-3xl font-bold tracking-tight">{value}</p>
    {caption && <p className="mt-1 text-xs opacity-75">{caption}</p>}
    {sparkline && <Sparkline points={sparkline} />}
  </div>
);

export default StatTile;
