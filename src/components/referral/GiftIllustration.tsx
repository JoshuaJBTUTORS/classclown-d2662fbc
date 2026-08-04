import React from 'react';

/** Decorative gift-box illustration for the refer-a-friend hero. */
export const GiftIllustration: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`relative grid place-items-center ${className}`}>
    <div className="pointer-events-none absolute h-72 w-72 rounded-full bg-primary/10 blur-2xl sm:h-80 sm:w-80" />
    <svg
      viewBox="0 0 420 360"
      className="relative w-full max-w-[420px] drop-shadow-[0_18px_24px_hsl(var(--primary)/0.18)]"
      role="img"
      aria-label="A gift box with a fifty pound reward card"
    >
      {/* confetti */}
      <g className="fill-primary/40">
        <rect x="130" y="40" width="12" height="12" rx="2" transform="rotate(-20 130 40)" />
        <rect x="300" y="24" width="14" height="10" rx="2" transform="rotate(18 300 24)" />
        <rect x="358" y="120" width="11" height="11" rx="2" transform="rotate(35 358 120)" />
        <rect x="70" y="150" width="10" height="10" rx="2" transform="rotate(12 70 150)" />
      </g>
      <g className="fill-amber-300/70">
        <rect x="200" y="18" width="13" height="9" rx="2" transform="rotate(-12 200 18)" />
        <rect x="352" y="196" width="12" height="9" rx="2" transform="rotate(28 352 196)" />
        <circle cx="112" cy="96" r="5" />
      </g>
      <g className="fill-primary/25">
        <circle cx="336" cy="72" r="6" />
        <circle cx="92" cy="236" r="5" />
        <circle cx="376" cy="268" r="7" />
      </g>

      {/* reward card */}
      <g>
        <rect x="146" y="60" width="150" height="140" rx="14" className="fill-card" />
        <rect x="146" y="60" width="150" height="140" rx="14" className="fill-primary/5" />
        <rect x="146.5" y="60.5" width="149" height="139" rx="13.5" className="stroke-primary/20" fill="none" />
        <text
          x="221"
          y="126"
          textAnchor="middle"
          className="fill-primary"
          style={{ fontSize: 44, fontWeight: 800, letterSpacing: '-0.03em' }}
        >
          £50
        </text>
        <text
          x="221"
          y="150"
          textAnchor="middle"
          className="fill-primary/70"
          style={{ fontSize: 15, fontWeight: 700, letterSpacing: '0.14em' }}
        >
          FOR YOU
        </text>
        <path
          d="M221 168c-9-9-19-5-19 4 0 7 10 13 19 20 9-7 19-13 19-20 0-9-10-13-19-4z"
          className="fill-primary/70"
        />
      </g>

      {/* box */}
      <path d="M126 178l95 22 95-22-14 132H140z" className="fill-primary/25" />
      <path d="M221 200l95-22-14 132h-81z" className="fill-primary/45" />
      <rect x="112" y="160" width="218" height="46" rx="10" className="fill-primary/35" />
      <rect x="204" y="160" width="34" height="150" className="fill-primary/60" />

      {/* people bubbles */}
      <g>
        <circle cx="64" cy="120" r="32" className="fill-card stroke-primary/25" strokeWidth="2" />
        <circle cx="64" cy="112" r="10" className="fill-primary/50" />
        <path d="M46 138c4-11 32-11 36 0z" className="fill-primary/50" />
      </g>
      <g>
        <circle cx="370" cy="60" r="30" className="fill-card stroke-primary/25" strokeWidth="2" />
        <circle cx="370" cy="53" r="9" className="fill-primary/50" />
        <path d="M354 76c4-10 28-10 32 0z" className="fill-primary/50" />
      </g>
    </svg>
  </div>
);

export default GiftIllustration;
