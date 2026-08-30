import React from 'react';
import { DoodleCoin, DoodleSpark } from '@/components/progress/ProgressDoodles';
import { DoodleSmiley } from '@/components/settings/DoodleIcons';

/** Decorative doodle-led illustration for the refer-a-friend hero. */
export const GiftIllustration: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`relative grid place-items-center ${className}`}>
    <div className="pointer-events-none absolute h-64 w-64 rounded-full bg-pastel-butter blur-2xl sm:h-72 sm:w-72" />

    <div className="relative flex flex-col items-center">
      <span
        className="absolute -left-14 -top-4 grid h-12 w-12 place-items-center rounded-full border border-foreground/15 bg-pastel-blush text-foreground"
        aria-hidden="true"
      >
        <DoodleSpark className="h-6 w-6" />
      </span>
      <span
        className="absolute -right-12 top-2 grid h-12 w-12 place-items-center rounded-full border border-foreground/15 bg-pastel-sky text-foreground"
        aria-hidden="true"
      >
        <DoodleCoin className="h-6 w-6" />
      </span>
      <span
        className="absolute -left-10 bottom-4 grid h-10 w-10 place-items-center rounded-full border border-foreground/15 bg-pastel-mint text-foreground"
        aria-hidden="true"
      >
        <DoodleSmiley className="h-5 w-5" />
      </span>

      <div className="rounded-2xl border border-foreground/10 bg-card px-8 py-5 text-center shadow-[var(--shadow-soft)]">
        <p className="font-heading text-4xl font-extrabold tracking-tight text-primary sm:text-5xl">£50</p>
        <p className="mt-1 text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">For you</p>
      </div>

      <span
        className="mt-2 font-heading font-extrabold leading-none tracking-tighter text-primary text-[7rem] sm:text-[9rem]"
        role="img"
        aria-label="Fifty pound reward"
      >
        £
      </span>
    </div>
  </div>
);

export default GiftIllustration;
