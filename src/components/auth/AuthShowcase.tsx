import React, { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import cleoHandAsset from '@/assets/auth/cleo-hand.png.asset.json';
import teacherCartoon from '@/assets/auth/teacher-cartoon.jpg';

const ROTATE_MS = 6000;

const usePrefersReducedMotion = () => {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return reduced;
};

const SlideFrame: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 18 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -18 }}
    transition={{ duration: 0.6, ease: 'easeOut' }}
    className="absolute inset-0 flex flex-col items-center justify-center gap-6 p-10 text-center"
  >
    {children}
  </motion.div>
);

/** Slide 1 — Cleo hand logo */
const CleoSlide: React.FC<{ float: boolean }> = ({ float }) => (
  <SlideFrame>
    <motion.img
      src={cleoHandAsset.url}
      alt="Cleo waving hand logo"
      className="h-52 w-52 object-contain drop-shadow-[0_25px_40px_hsl(var(--foreground)/0.25)]"
      animate={float ? { y: [0, -12, 0], rotate: [0, -4, 0] } : undefined}
      transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
    />
    <div>
      <h2 className="font-heading text-2xl font-bold text-foreground">Learning, with Cleo</h2>
      <p className="mx-auto mt-2 max-w-xs text-sm text-muted-foreground">
        Live tutoring, lesson plans and progress — all in one friendly place.
      </p>
    </div>
  </SlideFrame>
);

/** Slide 2 — Top-tier teachers */
const TeachersSlide: React.FC = () => (
  <SlideFrame>
    <motion.div
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="flex w-full justify-center"
    >
      <TeacherChalkboard />
    </motion.div>
    <div>
      <h2 className="font-heading text-2xl font-bold text-foreground">Taught by top-tier teachers</h2>
      <p className="mx-auto mt-2 max-w-xs text-sm text-muted-foreground">
        Qualified subject specialists, hand-picked for 11 Plus, GCSE and A Level.
      </p>
    </div>
  </SlideFrame>
);


const RESULTS = [
  { figure: '94%', label: '11 Plus pass rate', tone: 'bg-pastel-mint' },
  { figure: '97%', label: 'Grade 8+ at GCSE', tone: 'bg-pastel-sky' },
  { figure: '88%', label: 'A* and A at A Level', tone: 'bg-pastel-blush' },
];

/** Slide 3 — Proven results */
const ResultsSlide: React.FC = () => (
  <SlideFrame>
    <div className="w-full max-w-sm space-y-3">
      {RESULTS.map((r, i) => (
        <motion.div
          key={r.label}
          initial={{ opacity: 0, x: 18 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.12 + i * 0.12, duration: 0.5 }}
          className="flex items-center gap-4 rounded-2xl border border-border/50 bg-background/80 px-5 py-4 text-left shadow-[0_16px_40px_-30px_hsl(var(--foreground)/0.5)]"
        >
          <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${r.tone}`}>
            <svg viewBox="0 0 24 24" className="h-5 w-5 text-foreground/70" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 15l5-5 4 4 7-8" />
            </svg>
          </span>
          <span className="flex-1">
            <span className="block font-heading text-2xl font-bold leading-none text-foreground">{r.figure}</span>
            <span className="mt-1 block text-xs text-muted-foreground">{r.label}</span>
          </span>
          <span className="font-heading text-lg font-bold text-muted-foreground/40">
            0{i + 1}<span className="text-muted-foreground/25">/03</span>
          </span>
        </motion.div>
      ))}
    </div>
    <div>
      <h2 className="font-heading text-2xl font-bold text-foreground">Results families trust</h2>
      <p className="mx-auto mt-1 max-w-xs text-sm text-muted-foreground">
        Structured preparation that turns effort into offers.
      </p>
    </div>
  </SlideFrame>
);

export const AuthShowcase: React.FC = () => {
  const reduced = usePrefersReducedMotion();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [tick, setTick] = useState(0);

  const slides = [<CleoSlide key="cleo" float={!reduced} />, <TeachersSlide key="teachers" />, <ResultsSlide key="results" />];

  useEffect(() => {
    if (reduced || paused) return;
    const id = window.setTimeout(() => setIndex((i) => (i + 1) % slides.length), ROTATE_MS);
    return () => window.clearTimeout(id);
  }, [index, paused, reduced, tick, slides.length]);

  const goTo = useCallback((i: number) => {
    setIndex(i);
    setTick((t) => t + 1);
  }, []);

  return (
    <div
      className="relative flex h-full w-full flex-col"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="relative flex-1">
        <AnimatePresence mode="wait">
          <motion.div key={index} className="absolute inset-0">
            {slides[index]}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="relative flex items-center justify-center gap-2 pb-8">
        {slides.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Show slide ${i + 1}`}
            aria-current={i === index}
            onClick={() => goTo(i)}
            className={`h-2 rounded-full transition-all ${
              i === index ? 'w-6 bg-foreground/70' : 'w-2 bg-foreground/20 hover:bg-foreground/40'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default AuthShowcase;
