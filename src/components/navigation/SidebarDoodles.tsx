import React from 'react';

type DoodleProps = React.SVGProps<SVGSVGElement>;

const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

/** Calendar with binder rings + a couple of date dots. */
export const DoodleCalendar: React.FC<DoodleProps> = (props) => (
  <svg {...base} width={22} height={22} {...props}>
    <path d="M4.2 6.4c5.2-.6 10.4-.6 15.6 0 .5 4 .5 8 0 12-5.2.6-10.4.6-15.6 0-.5-4-.5-8 0-12Z" />
    <path d="M7.4 3.4c.1 1.8.1 3.6 0 5.4M16.4 3.2c.1 1.9.1 3.7 0 5.5" />
    <path d="M4.4 9.6c5.1.4 10.2.4 15.3 0" />
    <path d="M8.6 12.4h.02M12 12.4h.02M15.3 12.4h.02M8.6 15.4h.02M12 15.4h.02" />
  </svg>
);

/** Graduation cap / mortarboard with tassel. */
export const DoodleMortarboard: React.FC<DoodleProps> = (props) => (
  <svg {...base} width={22} height={22} {...props}>
    <path d="M3.4 9.2c2.8-1.4 5.7-2.1 8.6-2.1 2.9 0 5.8.7 8.6 2.1-2.8 1.4-5.7 2.1-8.6 2.1-2.9 0-5.8-.7-8.6-2.1Z" />
    <path d="M7 10.9c-.2 2.6-.2 5.3 0 7.9 1.6 1.2 3.3 1.8 5 1.8s3.4-.6 5-1.8c.2-2.6.2-5.3 0-7.9" />
    <path d="M20.6 9.2c.2 1.8.2 3.6 0 5.4" />
    <path d="M3.4 9.2c-.2 1.8-.2 3.6 0 5.4" />
  </svg>
);

/** Notebook with ruled lines. */
export const DoodleNotebook: React.FC<DoodleProps> = (props) => (
  <svg {...base} width={22} height={22} {...props}>
    <path d="M6.2 3.6c4-.6 8-.6 12 0 .5 5.6.5 11.2 0 16.8-4 .6-8 .6-12 0-.5-5.6-.5-11.2 0-16.8Z" />
    <path d="M9.2 8.4c2.6-.3 5.2-.3 7.8 0M9.2 11.4c2.6-.3 5.2-.3 7.8 0M9.2 14.4c2.6-.3 5.2-.3 7.8 0" />
    <path d="M6 6.2h.02M6 17.6h.02" />
  </svg>
);

/** Clipboard with a check mark. */
export const DoodleClipboardCheck: React.FC<DoodleProps> = (props) => (
  <svg {...base} width={22} height={22} {...props}>
    <path d="M4.8 6.6c4.8-.6 9.6-.6 14.4 0 .5 4.4.5 8.8 0 13.2-4.8.6-9.6.6-14.4 0-.5-4.4-.5-8.8 0-13.2Z" />
    <path d="M9.4 4.4c1.7-.3 3.5-.3 5.2 0 .2 1 .2 2 0 3-1.7.3-3.5.3-5.2 0-.2-1-.2-2 0-3Z" />
    <path d="M8.6 13.2l2.2 2.4c1.4-2 2.8-4 4.2-6" />
  </svg>
);

/** Video camera. */
export const DoodleVideo: React.FC<DoodleProps> = (props) => (
  <svg {...base} width={22} height={22} {...props}>
    <path d="M3.2 7.6c5.6-.6 11.2-.6 16.8 0 .5 2.9.5 5.9 0 8.8-5.6.6-11.2.6-16.8 0-.5-2.9-.5-5.9 0-8.8Z" />
    <path d="M20 10.2c1.4-.8 2.8-1.6 4-2.4M24 7.8M20 14c1.4.8 2.8 1.6 4 2.4" />
    <path d="M17.6 7.8c.6 2.9.6 5.7 0 8.5" />
    <path d="M6.6 11.6h.02M10.6 11.6h.02" />
  </svg>
);

/** Single person silhouette. */
export const DoodlePerson: React.FC<DoodleProps> = (props) => (
  <svg {...base} width={22} height={22} {...props}>
    <path d="M12 3.2c2.3-.1 3.7 1.5 3.6 3.6-.1 2-1.5 3.5-3.5 3.5-2.2 0-3.7-1.6-3.6-3.7C8.6 4.7 9.9 3.3 12 3.2Z" />
    <path d="M4.6 19.4c.6-3.6 3.6-5.6 7.4-5.6 3.9 0 6.9 2 7.5 5.7" />
    <path d="M5.6 21.6c3.9-.8 9.1-.9 13.1-.2" />
  </svg>
);

/** Person with a check mark (tutors). */
export const DoodlePersonCheck: React.FC<DoodleProps> = (props) => (
  <svg {...base} width={22} height={22} {...props}>
    <path d="M11 3.4c2.1-.1 3.4 1.4 3.3 3.3-.1 1.8-1.4 3.2-3.2 3.2-2 0-3.4-1.5-3.3-3.4.1-1.8 1.3-3.1 3.2-3.1Z" />
    <path d="M4.2 17.8c.5-3.3 3.3-5.1 6.8-5.1 3.6 0 6.4 1.8 6.9 5.2" />
    <path d="M15.4 14.8c1.8-.2 3.6.6 4.6 2.2" />
    <path d="M16.2 18.2c.7.9 1.7 1 2.5.1c1-1 2.2-1.1 3.3-.2" />
  </svg>
);

/** Person with a plus (staff). */
export const DoodlePersonPlus: React.FC<DoodleProps> = (props) => (
  <svg {...base} width={22} height={22} {...props}>
    <path d="M11 3.4c2.1-.1 3.4 1.4 3.3 3.3-.1 1.8-1.4 3.2-3.2 3.2-2 0-3.4-1.5-3.3-3.4.1-1.8 1.3-3.1 3.2-3.1Z" />
    <path d="M4.2 17.8c.5-3.3 3.3-5.1 6.8-5.1 1.4 0 2.7.3 3.8.8" />
    <path d="M18.2 13.4v4.4M16 15.6h4.4" />
  </svg>
);

/** Plain clipboard. */
export const DoodleClipboard: React.FC<DoodleProps> = (props) => (
  <svg {...base} width={22} height={22} {...props}>
    <path d="M4.8 6.6c4.8-.6 9.6-.6 14.4 0 .5 4.4.5 8.8 0 13.2-4.8.6-9.6.6-14.4 0-.5-4.4-.5-8.8 0-13.2Z" />
    <path d="M9.4 4.4c1.7-.3 3.5-.3 5.2 0 .2 1 .2 2 0 3-1.7.3-3.5.3-5.2 0-.2-1-.2-2 0-3Z" />
    <path d="M8.6 11.4c2.3-.3 4.6-.3 6.9 0M8.6 14.2c2.3-.3 4.6-.3 6.9 0M8.6 17c2.3-.3 4.6-.3 6.9 0" />
  </svg>
);

/** Speech bubble. */
export const DoodleSpeech: React.FC<DoodleProps> = (props) => (
  <svg {...base} width={22} height={22} {...props}>
    <path d="M4.2 5.6c5.2-.6 10.4-.6 15.6 0 .5 4 .5 8 0 12-4.2.6-8.4.6-12.6 0-1.1 1.4-2.2 2.8-3.4 4.2.4-5.4.4-10.8.4-16.2Z" />
    <path d="M8 10.2c2.6-.3 5.2-.3 7.8 0M8 13c2.6-.3 5.2-.3 7.8 0" />
  </svg>
);

/** Clock. */
export const DoodleClock: React.FC<DoodleProps> = (props) => (
  <svg {...base} width={22} height={22} {...props}>
    <path d="M12 3c5 .2 8.4 3.6 8.6 8.6.2 5.3-3.4 9.3-8.4 9.5-5.2.2-9-3.3-9.1-8.6C3 7.2 6.6 3.1 12 3Z" />
    <path d="M12 7.4v5.2M12 12.6c1.6.9 3.2 1.8 4.8 2.6" />
  </svg>
);

/** Two people / referral. */
export const DoodleReferral: React.FC<DoodleProps> = (props) => (
  <svg {...base} width={22} height={22} {...props}>
    <path d="M8.6 4.2c1.8-.1 2.9 1.2 2.8 2.8-.1 1.6-1.2 2.7-2.7 2.7-1.8 0-2.9-1.3-2.8-2.9.1-1.5 1.1-2.6 2.7-2.6Z" />
    <path d="M2.8 17.2c.4-2.8 2.5-4.3 5.2-4.3 2.8 0 4.9 1.5 5.3 4.3" />
    <path d="M15.4 8.2c1.6-.1 2.6 1.1 2.5 2.5-.1 1.4-1.1 2.4-2.4 2.4" />
    <path d="M17.6 14.4c1.9.4 3.2 1.7 3.6 3.6" />
  </svg>
);

/** Document with signature line. */
export const DoodleDocSign: React.FC<DoodleProps> = (props) => (
  <svg {...base} width={22} height={22} {...props}>
    <path d="M6.2 3.4c3.6-.5 7.2-.5 10.8 0 .4 5.8.4 11.6 0 17.4-3.6.5-7.2.5-10.8 0-.4-5.8-.4-11.6 0-17.4Z" />
    <path d="M8.6 8.2c2-.3 4-.3 6 0M8.6 11c2-.3 4-.3 6 0" />
    <path d="M8.8 16.4c.8-1.4 1.8-1.4 2.4 0 .5 1.2 1.4 1.2 2-.2.4-1 .9-1 1.4-.2" />
  </svg>
);

/** Film clapperboard. */
export const DoodleFilm: React.FC<DoodleProps> = (props) => (
  <svg {...base} width={22} height={22} {...props}>
    <path d="M3.6 8.2c5.6-.6 11.2-.6 16.8 0 .5 4.2.5 8.4 0 12.6-5.6.6-11.2.6-16.8 0-.5-4.2-.5-8.4 0-12.6Z" />
    <path d="M3.8 8.2c5.5-2.4 11-2.4 16.4 0" />
    <path d="M6.2 6.6l1.4 1.6M10.2 5.8l1.2 2M14.2 5.8l1.2 2M18 6.6l-1.2 1.4" />
  </svg>
);

/** Grid / dashboard. */
export const DoodleDashboard: React.FC<DoodleProps> = (props) => (
  <svg {...base} width={22} height={22} {...props}>
    <path d="M4 4.4c2.6-.4 5.2-.4 7.8 0 .3 2.6.3 5.2 0 7.8-2.6.4-5.2.4-7.8 0-.3-2.6-.3-5.2 0-7.8Z" />
    <path d="M12.2 4.4c2.6-.4 5.2-.4 7.8 0 .3 2.6.3 5.2 0 7.8-2.6.4-5.2.4-7.8 0" />
    <path d="M4 13.2c2.6-.4 5.2-.4 7.8 0 .3 2.6.3 5.2 0 7.8-2.6.4-5.2.4-7.8 0-.3-2.6-.3-5.2 0-7.8Z" />
    <path d="M12.2 13.2c2.6-.4 5.2-.4 7.8 0 .3 2.6.3 5.2 0 7.8-2.6.4-5.2.4-7.8 0" />
  </svg>
);

/** Target. */
export const DoodleTarget: React.FC<DoodleProps> = (props) => (
  <svg {...base} width={22} height={22} {...props}>
    <path d="M12 3c5 .2 8.4 3.6 8.6 8.6.2 5.3-3.4 9.3-8.4 9.5-5.2.2-9-3.3-9.1-8.6C3 7.2 6.6 3.1 12 3Z" />
    <path d="M12 7.4c2.6.1 4.4 1.9 4.5 4.5.1 2.8-1.8 4.8-4.5 4.8-2.7 0-4.6-2-4.5-4.8.1-2.6 1.9-4.4 4.5-4.5Z" />
    <path d="M12 11.2c.5 0 .8.3.8.8 0 .5-.3.8-.8.8-.5 0-.8-.3-.8-.8 0-.5.3-.8.8-.8Z" />
  </svg>
);

/** Signal waves (live sessions). */
export const DoodleSignal: React.FC<DoodleProps> = (props) => (
  <svg {...base} width={22} height={22} {...props}>
    <path d="M9.4 14.6c-1.8-1.8-1.8-4.6 0-6.4" />
    <path d="M6.6 17.4c-3.3-3.3-3.3-8.7 0-12" />
    <path d="M14.6 8.2c1.8 1.8 1.8 4.6 0 6.4" />
    <path d="M17.4 5.4c3.3 3.3 3.3 8.7 0 12" />
    <path d="M12 10.4c.9 0 1.6.7 1.6 1.6 0 .9-.7 1.6-1.6 1.6-.9 0-1.6-.7-1.6-1.6 0-.9.7-1.6 1.6-1.6Z" />
  </svg>
);

/** Open book. */
export const DoodleBook: React.FC<DoodleProps> = (props) => (
  <svg {...base} width={22} height={22} {...props}>
    <path d="M3.2 6c2.9-1.2 5.8-1.2 8.7 0 .2 4.7.2 9.3 0 14-2.9-1.2-5.8-1.2-8.7 0-.2-4.7-.2-9.3 0-14Z" />
    <path d="M11.9 6c2.9-1.2 5.8-1.2 8.7 0 .2 4.7.2 9.3 0 14-2.9-1.2-5.8-1.2-8.7 0" />
    <path d="M11.9 6v14" />
  </svg>
);

/** Coin (earnings). */
export const DoodleCoin: React.FC<DoodleProps> = (props) => (
  <svg {...base} width={22} height={22} {...props}>
    <path d="M12 3c5 .2 8.4 3.6 8.6 8.6.2 5.3-3.4 9.3-8.4 9.5-5.2.2-9-3.3-9.1-8.6C3 7.2 6.6 3.1 12 3Z" />
    <path d="M12 7c2.6.1 4.4 1.9 4.5 4.5.1 2.8-1.8 4.8-4.5 4.8-2.7 0-4.6-2-4.5-4.8.1-2.6 1.9-4.4 4.5-4.5Z" />
    <path d="M12 8.8v6.4M10 11.2h4M10 12.8h4" />
  </svg>
);

/** Trending line up. */
export const DoodleTrend: React.FC<DoodleProps> = (props) => (
  <svg {...base} width={22} height={22} {...props}>
    <path d="M3.4 17.6c2.8-3.2 5.6-5.2 8.4-5.2 2.2 0 4 1.2 5.8 3.2" />
    <path d="M14.4 15.6c1.2-1.2 2.4-2.4 3.6-3.6M18 12c.6-.6 1.2-1.2 1.8-1.8" />
    <path d="M19.8 12c-.2-1.2-.2-2.4 0-3.6c-1.2.2-2.4.2-3.6 0" />
  </svg>
);

/** Bar chart. */
export const DoodleBarChart: React.FC<DoodleProps> = (props) => (
  <svg {...base} width={22} height={22} {...props}>
    <path d="M3.4 20.4c5.8-.6 11.6-.6 17.4 0" />
    <path d="M6 17.4v-5M10 17.4v-9M14 17.4v-6M18 17.4v-3" />
    <path d="M5 18.8c4.8-.4 9.6-.4 14.4 0" />
  </svg>
);
