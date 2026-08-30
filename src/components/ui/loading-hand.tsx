import React from 'react';
import { cn } from '@/lib/utils';

interface LoadingHandProps {
  text?: string;
  fullScreen?: boolean;
  className?: string;
}

/**
 * ClassClown loading indicator: a waving hand that "loads up"
 * with a blue-to-pink ombre fill.
 */
export const LoadingHand: React.FC<LoadingHandProps> = ({
  text = 'Loading...',
  fullScreen = false,
  className,
}) => {
  const hand = (
    <div className="relative flex flex-col items-center gap-4">
      {/* Soft pastel glow */}
      <div
        aria-hidden="true"
        className="absolute top-1/2 left-1/2 h-28 w-28 -translate-x-1/2 -translate-y-[70%] rounded-full bg-gradient-to-tr from-blue-200/60 to-pink-200/60 blur-2xl"
      />
      <svg
        viewBox="0 0 64 64"
        className={cn('loading-hand-wave relative h-16 w-16', className)}
        fill="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="loading-hand-ombre" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="#60a5fa" />
            <stop offset="50%" stopColor="#a78bfa" />
            <stop offset="100%" stopColor="#f472b6" />
          </linearGradient>
          <clipPath id="loading-hand-clip">
            <path d="M32 6c-1.8 0-3 1.4-3 3.2V24h-2V12.5c0-1.8-1.3-3.2-3-3.2s-3 1.4-3 3.2V27h-2V15.8c0-1.8-1.3-3.2-3-3.2s-3 1.4-3 3.2V30l-1.6-3.6c-.7-1.6-2.5-2.4-4-1.6-1.6.7-2.3 2.5-1.6 4l6.5 15.2C17.6 49.9 23.9 56 32 56s14.4-6.1 15.7-12l3-13.5c.4-1.7-.7-3.4-2.4-3.7-1.3-.3-2.6.3-3.3 1.4l-2 3.8V9.2C43 7.4 41.8 6 40 6s-3 1.4-3 3.2V24h-2V9.2C35 7.4 33.8 6 32 6z" />
          </clipPath>
        </defs>

        {/* Base outline hand */}
        <path
          d="M32 6c-1.8 0-3 1.4-3 3.2V24h-2V12.5c0-1.8-1.3-3.2-3-3.2s-3 1.4-3 3.2V27h-2V15.8c0-1.8-1.3-3.2-3-3.2s-3 1.4-3 3.2V30l-1.6-3.6c-.7-1.6-2.5-2.4-4-1.6-1.6.7-2.3 2.5-1.6 4l6.5 15.2C17.6 49.9 23.9 56 32 56s14.4-6.1 15.7-12l3-13.5c.4-1.7-.7-3.4-2.4-3.7-1.3-.3-2.6.3-3.3 1.4l-2 3.8V9.2C43 7.4 41.8 6 40 6s-3 1.4-3 3.2V24h-2V9.2C35 7.4 33.8 6 32 6z"
          fill="hsl(var(--muted) / 0.35)"
          stroke="hsl(var(--foreground) / 0.55)"
          strokeWidth="2"
          strokeLinejoin="round"
        />

        {/* Ombre fill that rises on a loop */}
        <g clipPath="url(#loading-hand-clip)">
          <rect
            x="0"
            y="0"
            width="64"
            height="64"
            fill="url(#loading-hand-ombre)"
            className="loading-hand-fill"
          />
        </g>
      </svg>
      {text && (
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        {hand}
      </div>
    );
  }

  return <div className="flex items-center justify-center py-12">{hand}</div>;
};

export default LoadingHand;
