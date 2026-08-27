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

export const DoodleSmiley: React.FC<DoodleProps> = (props) => (
  <svg {...base} width={22} height={22} {...props}>
    <path d="M12 2.9c5 .2 8.4 3.6 8.6 8.6.2 5.3-3.4 9.3-8.4 9.5-5.2.2-9-3.3-9.1-8.6C3 7.2 6.6 3.1 12 2.9Z" />
    <path d="M8.4 9.6c.3-.7.9-.8 1.2 0" />
    <path d="M14.3 9.4c.4-.7 1-.6 1.2.1" />
    <path d="M8.2 14.1c1.6 1.9 5.5 2 7.4-.4" />
  </svg>
);

export const DoodlePerson: React.FC<DoodleProps> = (props) => (
  <svg {...base} width={22} height={22} {...props}>
    <path d="M12 3.2c2.3-.1 3.7 1.5 3.6 3.6-.1 2-1.5 3.5-3.5 3.5-2.2 0-3.7-1.6-3.6-3.7C8.6 4.7 9.9 3.3 12 3.2Z" />
    <path d="M4.6 19.4c.6-3.6 3.6-5.6 7.4-5.6 3.9 0 6.9 2 7.5 5.7" />
    <path d="M5.6 21.6c3.9-.8 9.1-.9 13.1-.2" />
  </svg>
);

export const DoodleLock: React.FC<DoodleProps> = (props) => (
  <svg {...base} width={22} height={22} {...props}>
    <path d="M4.9 10.6c4.6-.6 9.5-.6 14.2 0 .7 3.1.6 6.4-.1 9.6-4.7.7-9.5.7-14.1 0-.7-3.2-.7-6.4 0-9.6Z" />
    <path d="M8.1 10.2c-.4-3.2.7-5.5 3.8-5.6 3.1-.1 4.4 2.2 4.1 5.5" />
    <path d="M12 14v2.6" />
  </svg>
);

export const DoodleIdCard: React.FC<DoodleProps> = (props) => (
  <svg {...base} width={22} height={22} {...props}>
    <path d="M2.9 6.3c6.1-.8 12.2-.8 18.2 0 .6 3.8.6 7.6 0 11.4-6 .8-12.1.8-18.2 0-.6-3.8-.6-7.6 0-11.4Z" />
    <path d="M8.3 11.4c1.5-.2 2.1.7 1.9 1.7-.2 1-1.1 1.5-2 1.2-1-.3-1.3-1.4-.6-2.2" />
    <path d="M6.4 16.5c.5-1.5 3.9-1.7 4.7-.1" />
    <path d="M13.9 10.6c1.8-.3 3.5-.3 5.2 0" />
    <path d="M14 14.2c1.5-.3 3-.3 4.5 0" />
  </svg>
);

export const DoodleServer: React.FC<DoodleProps> = (props) => (
  <svg {...base} width={22} height={22} {...props}>
    <path d="M3.6 3.9c5.6-.7 11.3-.7 16.9 0 .5 1.6.5 3.3 0 5-5.6.7-11.3.7-16.9 0-.5-1.7-.5-3.4 0-5Z" />
    <path d="M3.6 14.9c5.6-.7 11.3-.7 16.9 0 .5 1.6.5 3.4 0 5-5.6.7-11.3.7-16.9 0-.5-1.6-.5-3.4 0-5Z" />
    <path d="M6.8 6.5h.02M6.8 17.4h.02" />
    <path d="M10.6 6.5c2 .1 4 .1 5.9 0" />
    <path d="M10.6 17.4c2 .1 4 .1 5.9 0" />
  </svg>
);
