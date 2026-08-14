import React from 'react';

/**
 * Decorative marker-style scribble used on the pastel subject tiles.
 * A loose back-and-forth diagonal squiggle with tapered, rounded ends.
 */
export const ScribbleStroke: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 320 190"
    fill="none"
    aria-hidden="true"
    focusable="false"
    className={className}
  >
    <g stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" fill="none">
      {/* long lower sweep */}
      <path
        d="M22 160C96 138 196 108 300 70"
        strokeWidth="26"
        opacity="0.5"
      />
      {/* return stroke */}
      <path
        d="M292 60C214 74 116 100 40 128"
        strokeWidth="22"
        opacity="0.45"
      />
      {/* upper sweep */}
      <path
        d="M62 106C138 86 218 62 288 40"
        strokeWidth="20"
        opacity="0.42"
      />
      {/* short top return */}
      <path
        d="M276 30C218 38 152 56 96 76"
        strokeWidth="16"
        opacity="0.35"
      />
      {/* fine top accent */}
      <path
        d="M130 58C176 44 224 30 268 20"
        strokeWidth="11"
        opacity="0.3"
      />
    </g>
  </svg>
);
