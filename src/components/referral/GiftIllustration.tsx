import React from 'react';

/** Decorative emoji-led illustration for the refer-a-friend hero. */
export const GiftIllustration: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`relative grid place-items-center ${className}`}>
    <div className="pointer-events-none absolute h-64 w-64 rounded-full bg-muted blur-2xl sm:h-72 sm:w-72" />

    <div className="relative flex flex-col items-center">
      <span className="absolute -left-14 -top-4 text-3xl sm:text-4xl" aria-hidden="true">
        🎉
      </span>
      <span className="absolute -right-12 top-2 text-3xl sm:text-4xl" aria-hidden="true">
        ✨
      </span>
      <span className="absolute -left-10 bottom-4 text-2xl sm:text-3xl" aria-hidden="true">
        👋
      </span>

      <div className="rounded-2xl border border-border bg-card px-8 py-5 text-center shadow-sm">
        <p className="text-4xl font-extrabold tracking-tight text-primary sm:text-5xl">£50</p>
        <p className="mt-1 text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">For you</p>
      </div>

      <span
        className="mt-2 font-extrabold leading-none tracking-tighter text-primary text-[7rem] sm:text-[9rem]"
        role="img"
        aria-label="Fifty pound reward"
      >
        £
      </span>
    </div>
  </div>
);

export default GiftIllustration;
