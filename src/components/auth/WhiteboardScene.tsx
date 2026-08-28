import React from 'react';

/**
 * Self-drawing whiteboard scene for the /auth showcase.
 *
 * Styled to match the "Results families trust" slide: light surface, hairline
 * border, soft shadow and a pastel icon badge. Strokes draw themselves on in
 * sequence and loop; reduced motion shows the finished board statically.
 */

const INK_CSS = `
@keyframes board-draw {
  0%   { stroke-dashoffset: var(--len); opacity: 0.85; }
  35%  { stroke-dashoffset: 0; opacity: 1; }
  85%  { stroke-dashoffset: 0; opacity: 1; }
  100% { stroke-dashoffset: 0; opacity: 0; }
}
.board-path {
  stroke-dasharray: var(--len);
  stroke-dashoffset: var(--len);
  animation: board-draw 6s ease-in-out infinite;
}
@media (prefers-reduced-motion: reduce) {
  .board-path { stroke-dashoffset: 0; animation: none; opacity: 1; }
}
`;

type StrokeProps = {
  d: string;
  len: number;
  delay: number;
  width?: number;
};

const Ink: React.FC<StrokeProps> = ({ d, len, delay, width = 2 }) => (
  <path
    d={d}
    className="board-path"
    style={{ ['--len' as string]: len, animationDelay: `${delay}s` }}
    fill="none"
    stroke="currentColor"
    strokeWidth={width}
    strokeLinecap="round"
    strokeLinejoin="round"
  />
);

export const WhiteboardScene: React.FC = () => (
  <div className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-border/50 bg-background/80 p-4 shadow-[0_16px_40px_-30px_hsl(var(--foreground)/0.5)]">
    <style dangerouslySetInnerHTML={{ __html: INK_CSS }} />

    <div className="relative aspect-[4/3] w-full text-foreground/70">
      <svg viewBox="0 0 400 300" className="absolute inset-0 h-full w-full" aria-hidden="true">
        <rect x="6" y="6" width="388" height="288" rx="14" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.15" />

        <g>
          {/* top-left equation */}
          <Ink d="M36 56 h34 M44 48 v20 M84 48 l18 20 M102 48 l-18 20 M120 56 h26" len={140} delay={0.1} />
          {/* fraction */}
          <Ink d="M38 104 h44 M44 94 h30 M50 116 h22" len={100} delay={0.6} />
          {/* boxed formula, top right */}
          <Ink d="M232 40 h130 v54 h-130 z" len={368} delay={1.0} width={1.6} />
          <Ink d="M250 70 h22 M286 54 v28 M304 54 l18 28 M330 62 h18" len={110} delay={1.4} />
          {/* notes */}
          <Ink d="M38 152 h72 M38 168 h96 M38 184 h52" len={220} delay={1.8} width={1.4} />
          {/* angle diagram, bottom left */}
          <Ink d="M40 268 l52 -60 M40 268 h74 M40 268 l60 -20" len={210} delay={2.2} />
          <Ink d="M64 264 a24 24 0 0 1 6 -18" len={40} delay={2.6} width={1.4} />
          {/* sine wave with axis, right */}
          <Ink d="M180 268 h180 M196 150 v130" len={310} delay={2.9} width={1.4} />
          <Ink d="M184 226 q26 -52 52 0 q26 52 52 0 q26 -52 52 0" len={370} delay={3.2} />
        </g>
      </svg>
    </div>

    {/* pastel badge, echoing the results slide */}
    <span className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-xl bg-pastel-sky">
      <svg viewBox="0 0 24 24" className="h-5 w-5 text-foreground/70" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 5h18v11H3z" />
        <path d="M12 16v4M8 20h8" />
      </svg>
    </span>
  </div>
);

export default WhiteboardScene;
