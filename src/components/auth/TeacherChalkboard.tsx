import React from 'react';
import teacherFigure from '@/assets/auth/teacher-figure.png';

/**
 * Animated chalkboard scene for the /auth showcase.
 *
 * The tutor figure sits on the right; chalk equations and diagrams draw
 * themselves on in sequence (stroke-dashoffset), loop, and respect
 * prefers-reduced-motion by showing the finished board statically.
 */

const CHALK_CSS = `
@keyframes chalk-draw {
  0%   { stroke-dashoffset: var(--len); opacity: 0.9; }
  35%  { stroke-dashoffset: 0; opacity: 1; }
  85%  { stroke-dashoffset: 0; opacity: 1; }
  100% { stroke-dashoffset: 0; opacity: 0; }
}
@keyframes chalk-arm {
  0%, 100% { transform: translate(0px, 0px) rotate(0deg); }
  25%      { transform: translate(-3px, 2px) rotate(-1.5deg); }
  60%      { transform: translate(2px, -2px) rotate(1.2deg); }
}
@keyframes chalk-dust {
  0%, 100% { opacity: 0.15; transform: scale(0.9); }
  50%      { opacity: 0.4; transform: scale(1.15); }
}
.chalk-path {
  stroke-dasharray: var(--len);
  stroke-dashoffset: var(--len);
  animation: chalk-draw 6s ease-in-out infinite;
}
.chalk-arm { animation: chalk-arm 6s ease-in-out infinite; transform-origin: 70% 20%; }
.chalk-dust { animation: chalk-dust 6s ease-in-out infinite; }
@media (prefers-reduced-motion: reduce) {
  .chalk-path { stroke-dashoffset: 0; animation: none; opacity: 1; }
  .chalk-arm, .chalk-dust { animation: none; }
}
`;

type StrokeProps = {
  d: string;
  len: number;
  delay: number;
  width?: number;
};

const Chalk: React.FC<StrokeProps> = ({ d, len, delay, width = 2 }) => (
  <path
    d={d}
    className="chalk-path"
    style={{ ['--len' as string]: len, animationDelay: `${delay}s` }}
    fill="none"
    stroke="currentColor"
    strokeWidth={width}
    strokeLinecap="round"
    strokeLinejoin="round"
  />
);

export const TeacherChalkboard: React.FC = () => (
  <div className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-border/40 bg-foreground shadow-[0_25px_60px_-25px_hsl(var(--foreground)/0.55)]">
    <style dangerouslySetInnerHTML={{ __html: CHALK_CSS }} />

    {/* chalk-dust texture */}
    <div className="pointer-events-none absolute inset-0 opacity-[0.07] bg-[radial-gradient(circle_at_20%_30%,hsl(var(--background))_0%,transparent_45%),radial-gradient(circle_at_80%_70%,hsl(var(--background))_0%,transparent_40%)]" />

    <div className="relative aspect-[4/3] w-full text-background">
      {/* board frame */}
      <svg viewBox="0 0 400 300" className="absolute inset-0 h-full w-full" aria-hidden="true">
        <rect x="8" y="8" width="384" height="284" rx="10" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.25" />

        <g opacity="0.9">
          {/* top-left equation */}
          <Chalk d="M32 52 h34 M40 44 v20 M78 44 l18 20 M96 44 l-18 20 M112 52 h26" len={140} delay={0.1} />
          {/* fraction */}
          <Chalk d="M34 92 h44 M40 82 h30 M46 104 h22" len={100} delay={0.6} />
          {/* boxed formula, top right */}
          <Chalk d="M262 40 h108 v40 h-108 z" len={296} delay={1.0} width={1.6} />
          <Chalk d="M276 66 h20 M304 52 v22 M320 52 l14 22 M340 52 h18" len={90} delay={1.4} />
          {/* sector / angle diagram, bottom left */}
          <Chalk d="M40 258 l52 -62 M40 258 h74 M40 258 l60 -20 M40 258 l30 -50" len={260} delay={1.8} />
          <Chalk d="M64 254 a24 24 0 0 1 6 -18" len={40} delay={2.4} width={1.4} />
          {/* sine wave with axis, bottom right */}
          <Chalk d="M212 268 h150 M232 208 v70" len={220} delay={2.7} width={1.4} />
          <Chalk d="M216 240 q18 -40 36 0 q18 40 36 0 q18 -40 36 0 q18 40 36 0" len={330} delay={3.1} />
          {/* small notes */}
          <Chalk d="M150 118 h40 M150 130 h64 M150 142 h28" len={132} delay={3.6} width={1.4} />
        </g>
      </svg>

      {/* tutor figure */}
      <img
        src={teacherFigure}
        alt="Cartoon tutor writing equations on a chalkboard"
        loading="lazy"
        width={552}
        height={671}
        className="chalk-arm absolute bottom-0 right-2 h-[86%] w-auto object-contain drop-shadow-[0_10px_25px_hsl(var(--foreground)/0.6)]"
      />

      {/* chalk-dust glow at the pen tip */}
      <span className="chalk-dust pointer-events-none absolute right-[38%] top-[16%] h-8 w-8 rounded-full bg-background blur-xl" />
    </div>
  </div>
);

export default TeacherChalkboard;
