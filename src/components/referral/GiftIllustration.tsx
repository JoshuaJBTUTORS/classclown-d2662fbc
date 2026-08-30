import React from 'react';
import { cn } from '@/lib/utils';
import { DoodleCoin, DoodleSpark, DoodleSend, DoodleChat } from '@/components/progress/ProgressDoodles';

interface GiftIllustrationProps {
  className?: string;
}

const GiftIllustration: React.FC<GiftIllustrationProps> = ({ className }) => {
  return (
    <div className={cn('relative flex items-center justify-center', className)} aria-hidden="true">
      {/* soft glow */}
      <div className="absolute h-56 w-56 rounded-full bg-pastel-butter/80 blur-3xl" />

      {/* floating doodle chips */}
      <span className="absolute left-2 top-6 grid h-11 w-11 rotate-[-8deg] place-items-center rounded-full border border-foreground bg-pastel-blush text-foreground shadow-[var(--shadow-soft)]">
        <DoodleSpark className="h-5 w-5" />
      </span>
      <span className="absolute right-3 top-10 grid h-12 w-12 rotate-[10deg] place-items-center rounded-full border border-foreground bg-pastel-sky text-foreground shadow-[var(--shadow-soft)]">
        <DoodleCoin className="h-5 w-5" />
      </span>
      <span className="absolute bottom-8 left-6 grid h-10 w-10 rotate-[6deg] place-items-center rounded-full border border-foreground bg-pastel-butter text-foreground shadow-[var(--shadow-soft)]">
        <DoodleSend className="h-4 w-4" />
      </span>
      <span className="absolute bottom-4 right-8 grid h-10 w-10 rotate-[-10deg] place-items-center rounded-full border border-foreground bg-pastel-mint text-foreground shadow-[var(--shadow-soft)]">
        <DoodleChat className="h-4 w-4" />
      </span>

      {/* sticker card */}
      <div className="relative rotate-[-3deg] rounded-3xl border border-foreground bg-background px-10 py-8 text-center shadow-[var(--shadow-soft)] transition-transform duration-300 hover:rotate-0">
        <span className="absolute -top-3 left-1/2 h-6 w-16 -translate-x-1/2 rotate-[-4deg] rounded-sm border border-foreground/40 bg-pastel-butter/90" />
        <p className="font-heading text-6xl font-bold tracking-tighter text-primary">£50</p>
        <p className="mt-1 font-heading text-xs font-extrabold uppercase tracking-[0.25em] text-foreground">
          For you
        </p>
        <div className="mt-4 flex items-center justify-center gap-2">
          <span className="h-2 w-2 rounded-full border border-foreground bg-pastel-blush" />
          <span className="h-2 w-2 rounded-full border border-foreground bg-pastel-butter" />
          <span className="h-2 w-2 rounded-full border border-foreground bg-pastel-sky" />
        </div>
      </div>
    </div>
  );
};

export default GiftIllustration;
