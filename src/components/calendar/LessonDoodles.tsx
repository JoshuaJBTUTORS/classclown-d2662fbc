import React from 'react';

interface DoodleProps {
  className?: string;
}

const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

export const DoodleCalendar: React.FC<DoodleProps> = ({ className }) => (
  <svg {...base} className={className}>
    <path d="M4.2 7.4c3.6-.7 12-.9 15.6-.2.5 3.6.5 8.6-.1 12.1-4.8.8-10.9.7-15.4 0-.6-3.5-.5-8.4-.1-11.9Z" />
    <path d="M8 4.4v3.2M16 4.2v3.4M4.6 11.4c4.7-.6 10.6-.6 14.8-.1" />
  </svg>
);

export const DoodleClock: React.FC<DoodleProps> = ({ className }) => (
  <svg {...base} className={className}>
    <path d="M12 3.6c4.7 0 8.4 3.8 8.3 8.5-.1 4.6-3.7 8.3-8.4 8.3-4.6 0-8.3-3.8-8.2-8.5C3.8 7.2 7.4 3.6 12 3.6Z" />
    <path d="M12 7.4v4.8l3.2 2" />
  </svg>
);

export const DoodlePerson: React.FC<DoodleProps> = ({ className }) => (
  <svg {...base} className={className}>
    <path d="M12 4.2c2 0 3.4 1.5 3.3 3.4-.1 1.9-1.5 3.3-3.4 3.2-1.9 0-3.3-1.5-3.2-3.4C8.8 5.6 10.1 4.2 12 4.2Z" />
    <path d="M4.9 19.7c.6-3.6 3.5-5.6 7.2-5.6s6.5 2 7 5.5c-4.6.7-9.6.8-14.2.1Z" />
  </svg>
);

export const DoodlePeople: React.FC<DoodleProps> = ({ className }) => (
  <svg {...base} className={className}>
    <path d="M9.3 4.6c1.8 0 3 1.3 3 2.9 0 1.7-1.3 2.9-3 2.9s-3-1.3-2.9-3c0-1.6 1.2-2.8 2.9-2.8Z" />
    <path d="M3.3 19.4c.5-3.2 3-5 6-5s5.5 1.8 5.9 4.9c-3.9.6-8.1.7-11.9.1Z" />
    <path d="M16.1 6.2c1.6-.4 3.1.7 3.2 2.3.1 1.5-1 2.6-2.5 2.7M17.6 14.3c1.7.4 2.8 1.7 3.1 3.7-1 .3-2 .4-3 .5" />
  </svg>
);

export const DoodleTag: React.FC<DoodleProps> = ({ className }) => (
  <svg {...base} className={className}>
    <path d="M11 3.9 4.3 4.5c-.4 2.1-.5 4.5-.3 6.7l7.7 8.3c1.1.5 7.6-6 7.4-7.4L11 3.9Z" />
    <path d="M8.1 8.1c.1.1.1.2 0 .2" />
  </svg>
);

export const DoodleVideo: React.FC<DoodleProps> = ({ className }) => (
  <svg {...base} className={className}>
    <path d="M3.6 7.4c3.5-.6 7.5-.6 11 0 .4 3.1.4 6.2 0 9.3-3.6.6-7.6.6-11 0-.5-3.1-.5-6.2 0-9.3Z" />
    <path d="M15 11.2c1.6-1.3 3.2-2.4 5.1-3.2.4 2.7.4 5.4 0 8.1-1.9-.8-3.5-1.9-5.1-3.2" />
  </svg>
);

export const DoodleBook: React.FC<DoodleProps> = ({ className }) => (
  <svg {...base} className={className}>
    <path d="M4 5c2.6-.6 5.3-.5 8 .9 2.7-1.4 5.4-1.5 8-.9.5 4.3.5 8.6 0 12.9-2.6-.5-5.3-.4-8 1-2.7-1.4-5.4-1.5-8-1-.5-4.3-.5-8.6 0-12.9Z" />
    <path d="M12 5.9v13" />
  </svg>
);

export const DoodleCheck: React.FC<DoodleProps> = ({ className }) => (
  <svg {...base} className={className}>
    <path d="M12 3.7c4.6-.1 8.4 3.6 8.3 8.3-.1 4.6-3.7 8.3-8.4 8.3-4.6 0-8.3-3.8-8.2-8.5.1-4.5 3.8-8 8.3-8.1Z" />
    <path d="m8.2 12.2 2.6 2.7 5-5.6" />
  </svg>
);

export const DoodleCircle: React.FC<DoodleProps> = ({ className }) => (
  <svg {...base} className={className}>
    <path d="M12 3.7c4.6-.1 8.4 3.6 8.3 8.3-.1 4.6-3.7 8.3-8.4 8.3-4.6 0-8.3-3.8-8.2-8.5.1-4.5 3.8-8 8.3-8.1Z" />
  </svg>
);

export const DoodleClipboard: React.FC<DoodleProps> = ({ className }) => (
  <svg {...base} className={className}>
    <path d="M9 4.6c-1.6.1-3 .2-4.2.5-.6 4.7-.6 9.7 0 14.4 4.9.7 9.6.7 14.4 0 .6-4.7.6-9.7 0-14.4-1.2-.3-2.6-.4-4.2-.5" />
    <path d="M9.2 3.4c1.9-.3 3.7-.3 5.6 0 .2 1 .2 2 0 3-1.9.3-3.7.3-5.6 0-.2-1-.2-2 0-3Z" />
    <path d="m8.6 13.6 2.2 2.2 4.4-5" />
  </svg>
);

export const DoodleAlert: React.FC<DoodleProps> = ({ className }) => (
  <svg {...base} className={className}>
    <path d="M12 4c1 0 7.6 12.7 7.4 13.8-.2 1.2-13.9 1.3-14.7.2C3.8 16.9 11 4 12 4Z" />
    <path d="M12 9.6v3.6M12 16.1v.1" />
  </svg>
);

export const DoodleShield: React.FC<DoodleProps> = ({ className }) => (
  <svg {...base} className={className}>
    <path d="M12 3.6c2.3 1.3 4.6 2 7 2.1.5 6.3-1.7 11-7 14.6-5.3-3.6-7.5-8.3-7-14.6 2.4-.1 4.7-.8 7-2.1Z" />
  </svg>
);

export const DoodleSparkle: React.FC<DoodleProps> = ({ className }) => (
  <svg {...base} className={className}>
    <path d="M12 3.6c.6 3.4 1.9 5.4 5 6-3.1.6-4.4 2.6-5 6-.6-3.4-1.9-5.4-5-6 3.1-.6 4.4-2.6 5-6Z" />
    <path d="M18.6 4.2c.2 1 .6 1.6 1.6 1.8-1 .2-1.4.8-1.6 1.8-.2-1-.6-1.6-1.6-1.8 1-.2 1.4-.8 1.6-1.8Z" />
    <path d="M6.6 15.6c.2 1 .6 1.6 1.6 1.8-1 .2-1.4.8-1.6 1.8-.2-1-.6-1.6-1.6-1.8 1-.2 1.4-.8 1.6-1.8Z" />
  </svg>
);

/**
 * Hand-drawn waving hand. The hand group rotates from the wrist via the
 * `.animate-wave` utility (transform-origin set at 12px 21px). Apply the
 * class on the element wrapping this SVG (or pass it through className).
 */
export const DoodleWave: React.FC<DoodleProps> = ({ className }) => (
  <svg {...base} className={className}>
    <g className="animate-wave">
      {/* wrist / forearm */}
      <path d="M9.2 20.4c-.6-1.8-.7-3.4-.4-4.6.4-1.3 1.2-2 2.4-2.3" />
      {/* palm */}
      <path d="M10.8 13.6c.2-1.3.1-2.6-.1-3.9-.1-.6.3-1 .9-1 .5 0 .8.3.9.9.2 1.2.3 2.4.2 3.6" />
      {/* fingers */}
      <path d="M13.4 12.8c.1-1.6.1-3.2-.1-4.8-.1-.6.2-1 .8-1 .5 0 .8.3.9.9.2 1.6.2 3.2.1 4.8" />
      <path d="M15.6 12.6c.1-1.5.1-3-.1-4.5-.1-.6.2-1 .8-1 .5 0 .8.3.9.9.2 1.5.2 3 .1 4.5" />
      <path d="M17.6 13.2c.1-1.2.1-2.4-.1-3.6-.1-.5.2-.9.7-.9.5 0 .8.3.9.8.2 1.2.2 2.4.1 3.6" />
      {/* thumb */}
      <path d="M10.6 12.4c-.5-.2-1-.1-1.4.3-.5.5-.5 1.2-.1 1.7l2.6 2.6c1 .9 2.4 1 3.4.1 1.2-1 1.2-2.6.1-3.6" />
    </g>
    {/* motion lines */}
    <path d="M2.8 9.4c-1-.3-1.6-.2-2 .2" />
    <path d="M3.8 6.6c-.8-.5-1.4-.6-1.9-.4" />
    <path d="M5.6 4.4c-.5-.6-1-.9-1.5-.9" />
  </svg>
);
