import React from 'react';

/**
 * Hand-drawn doodle icons for the progress page.
 * Stroke inherits currentColor so they sit on pastel tiles.
 */
type DoodleProps = { className?: string };

const base = {
  fill: 'none' as const,
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

export const DoodleBook: React.FC<DoodleProps> = ({ className }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className} {...base}>
    <path d="M3.5 5.2c2.7-.8 5.3-.9 8 .4 2.6-1.4 5.3-1.3 8-.5" />
    <path d="M3.5 5.2c-.2 4.4-.1 8.7.2 13 2.5-.7 5.1-.7 7.6.5 2.6-1.3 5.3-1.3 8-.6.3-4.3.4-8.6.2-12.9" />
    <path d="M11.6 5.6c.2 4.4.2 8.8.1 13.1" />
  </svg>
);

export const DoodleCalendar: React.FC<DoodleProps> = ({ className }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className} {...base}>
    <path d="M4 7.4c5.3-.7 10.6-.8 16-.3.4 4.1.4 8.2 0 12.3-5.3.6-10.6.6-16 0-.5-4-.5-8 0-12z" />
    <path d="M8 4.2v4M16 4.2v4M4.3 11.6c5.2-.5 10.4-.6 15.6-.2" />
    <path d="M9.2 15.4l1.8 2 3.6-3.6" />
  </svg>
);

export const DoodleSpark: React.FC<DoodleProps> = ({ className }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className} {...base}>
    <path d="M12 3.4c.7 3.4 2.1 5.1 5.4 5.9-3.3.9-4.7 2.6-5.4 6-.7-3.4-2.1-5.1-5.4-6 3.3-.8 4.7-2.5 5.4-5.9z" />
    <path d="M18.6 15.4c.3 1.4.9 2.1 2.3 2.5-1.4.4-2 1.1-2.3 2.5-.3-1.4-.9-2.1-2.3-2.5 1.4-.4 2-1.1 2.3-2.5z" />
  </svg>
);

export const DoodleTrendUp: React.FC<DoodleProps> = ({ className }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className} {...base}>
    <path d="M3.5 17.6c2.6-.4 4.3-2.2 6-4.4 1.5-1.9 3-3.9 5.4-5.3" />
    <path d="M11.6 6.6c1.5-.3 2.9-.4 4.4-.3.2 1.5.2 2.9.1 4.4" />
    <path d="M3.6 20.4c5.6.5 11.2.5 16.8 0" />
  </svg>
);

export const DoodleTrendDown: React.FC<DoodleProps> = ({ className }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className} {...base}>
    <path d="M3.5 7.2c2.6.4 4.3 2.2 6 4.4 1.5 1.9 3 3.9 5.4 5.3" />
    <path d="M11.6 17.4c1.5.3 2.9.4 4.4.3.2-1.5.2-2.9.1-4.4" />
    <path d="M3.6 20.4c5.6.5 11.2.5 16.8 0" />
  </svg>
);

export const DoodleLock: React.FC<DoodleProps> = ({ className }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className} {...base}>
    <path d="M5.4 10.6c4.4-.6 8.8-.6 13.2 0 .5 3.2.5 6.4 0 9.6-4.4.6-8.8.6-13.2 0-.5-3.2-.5-6.4 0-9.6z" />
    <path d="M8.4 10.3c-.3-2.2-.1-4.4 2.2-5.2 2.3-.8 4.5.5 4.9 2.7.1.8.1 1.7.1 2.5" />
    <path d="M12 14.2v2.6" />
  </svg>
);

export const DoodleFaceHappy: React.FC<DoodleProps> = ({ className }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className} {...base}>
    <path d="M12 3.4c4.8 0 8.6 3.8 8.6 8.6S16.8 20.6 12 20.6 3.4 16.8 3.4 12 7.2 3.4 12 3.4z" />
    <path d="M8.6 9.6c.1-.7.2-1.2.3-1.6M15.1 9.6c.1-.7.2-1.2.3-1.6" />
    <path d="M8 13.6c2.4 2.4 5.6 2.4 8 0" />
  </svg>
);

export const DoodleFaceSteady: React.FC<DoodleProps> = ({ className }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className} {...base}>
    <path d="M12 3.4c4.8 0 8.6 3.8 8.6 8.6S16.8 20.6 12 20.6 3.4 16.8 3.4 12 7.2 3.4 12 3.4z" />
    <path d="M8.7 9.3v.6M15.3 9.3v.6" />
    <path d="M8.4 14.4c2.4-.5 4.8-.5 7.2 0" />
  </svg>
);

export const DoodleFaceLow: React.FC<DoodleProps> = ({ className }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className} {...base}>
    <path d="M12 3.4c4.8 0 8.6 3.8 8.6 8.6S16.8 20.6 12 20.6 3.4 16.8 3.4 12 7.2 3.4 12 3.4z" />
    <path d="M8.7 9.3v.6M15.3 9.3v.6" />
    <path d="M8.4 15.6c2.3-2.1 4.9-2.1 7.2 0" />
  </svg>
);

export const DoodleStar: React.FC<DoodleProps> = ({ className }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className} {...base}>
    <path d="M12 3.6l2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.8-5.2 2.8 1-5.8L3.6 9.7l5.8-.8L12 3.6z" />
  </svg>
);

export const DoodleEmpty: React.FC<DoodleProps> = ({ className }) => (
  <svg viewBox="0 0 64 48" aria-hidden="true" className={className} {...base} strokeWidth={1.4}>
    <path d="M6 38c8-1.5 12-8 17-14.5C27.6 17.6 33 12 42 9.6" />
    <path d="M36 8.6c2.8-.8 5.6-1.2 8.5-1.1.4 2.8.4 5.6.1 8.4" />
    <path d="M4 44c18.6 1.4 37.4 1.4 56 0" />
    <path d="M14 30c1.6 1.6 3.6 2.4 5.8 2.4" opacity="0.5" />
  </svg>
);
