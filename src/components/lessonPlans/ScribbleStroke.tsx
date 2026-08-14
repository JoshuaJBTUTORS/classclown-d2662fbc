import React from 'react';

/**
 * Decorative brush scribble used on the pastel subject tiles.
 *
 * Matches the reference artwork: a loose set of overlapping marker sweeps that
 * run from the lower-left up to the upper-right, each one slightly curved and
 * tapered to a point at both tips. Filled lens shapes (rather than strokes) keep
 * the thin-thick-thin taper correct at any tile size.
 */
export const ScribbleStroke: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 320 190"
    fill="currentColor"
    stroke="none"
    aria-hidden="true"
    focusable="false"
    preserveAspectRatio="xMidYMid meet"
    className={className}
  >
    {/* short top sweep, angled up to the right */}
    <path
      d="M150 54C196 38 244 24 292 14C286 22 262 32 232 42C202 52 172 58 150 62C146 60 146 56 150 54Z"
      opacity="0.5"
    />
    {/* long upper sweep with a soft curve */}
    <path
      d="M62 104C132 84 214 56 298 30C276 48 234 66 186 84C138 102 96 112 62 114C56 112 56 106 62 104Z"
      opacity="0.55"
    />
    {/* main body sweep — longest and thickest */}
    <path
      d="M36 148C118 132 216 98 304 60C280 88 226 114 168 136C110 158 66 166 36 160C28 157 28 150 36 148Z"
      opacity="0.6"
    />
    {/* lower tail sweep */}
    <path
      d="M22 178C76 172 142 154 208 126C176 154 122 176 62 184C40 186 24 184 22 182Z"
      opacity="0.45"
    />
  </svg>
);
