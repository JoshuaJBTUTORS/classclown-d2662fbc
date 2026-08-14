import React from 'react';

/** Decorative hand-painted brush squiggle used on the pastel subject tiles. */
export const ScribbleStroke: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 320 140"
    fill="none"
    aria-hidden="true"
    focusable="false"
    className={className}
  >
    <g stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" fill="none">
      <path d="M18 96C60 40 132 24 214 34c26 3 52 10 70 24" strokeWidth="26" opacity="0.5" />
      <path d="M40 122C92 84 168 74 246 82c22 2 42 7 56 16" strokeWidth="18" opacity="0.38" />
      <path d="M96 60c48-16 104-18 152-6" strokeWidth="12" opacity="0.32" />
    </g>
  </svg>
);
