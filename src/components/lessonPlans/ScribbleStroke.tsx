import React from 'react';

/**
 * Decorative brush scribble used on the pastel subject tiles.
 *
 * Drawn as filled lens-shaped paths rather than plain strokes so each sweep
 * tapers to a point at both ends (like a dry brush / marker), which is what the
 * reference artwork does. Filled geometry also scales cleanly at any tile size —
 * a stroke-based version keeps a constant relative width and loses the taper.
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
    {/* top sweep — shortest, finest */}
    <path
      d="M138 60C186 45 240 28 288 16C252 40 196 54 138 60Z"
      opacity="0.34"
    />
    {/* upper return sweep */}
    <path
      d="M74 106C148 88 226 62 296 36C230 78 148 104 74 106Z"
      opacity="0.42"
    />
    {/* main sweep — longest and thickest */}
    <path
      d="M44 140C124 124 218 92 302 58C224 112 130 142 44 140Z"
      opacity="0.5"
    />
    {/* lower return sweep — short tail */}
    <path
      d="M24 172C82 166 150 148 214 122C158 164 88 178 24 172Z"
      opacity="0.38"
    />
  </svg>
);
