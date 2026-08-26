import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, RotateCcw, Shuffle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScribbleStroke } from '@/components/lessonPlans/ScribbleStroke';
import { PastelTone } from '@/components/lessonPlans/pastelPalette';

export interface RevisionCard {
  front: string;
  back: string;
  focus_area?: string;
  difficulty?: 'easy' | 'medium' | 'hard' | string;
}

interface FlashcardDeckProps {
  cards: RevisionCard[];
  tone?: PastelTone;
}

const pillClass =
  'inline-flex h-11 items-center gap-2 rounded-full bg-muted/50 px-5 text-sm font-medium text-foreground shadow-[var(--shadow-soft)] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0';

const FlashcardDeck: React.FC<FlashcardDeckProps> = ({ cards, tone }) => {
  const [order, setOrder] = useState<number[]>(() => cards.map((_, i) => i));
  const [position, setPosition] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const current = useMemo(() => cards[order[position]], [cards, order, position]);

  if (!current) return null;

  const go = (delta: number) => {
    setFlipped(false);
    setPosition((p) => Math.min(Math.max(p + delta, 0), order.length - 1));
  };

  const shuffle = () => {
    const next = [...order];
    for (let i = next.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [next[i], next[j]] = [next[j], next[i]];
    }
    setOrder(next);
    setPosition(0);
    setFlipped(false);
  };

  const restart = () => {
    setOrder(cards.map((_, i) => i));
    setPosition(0);
    setFlipped(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="inline-flex h-9 items-center rounded-full bg-muted/50 px-4 text-xs font-medium text-muted-foreground">
          Card {position + 1} of {order.length}
        </span>
        <div className="flex gap-2">
          <button type="button" className={pillClass} onClick={shuffle}>
            <Shuffle className="h-4 w-4" /> Shuffle
          </button>
          <button type="button" className={pillClass} onClick={restart}>
            <RotateCcw className="h-4 w-4" /> Restart
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        className={cn(
          'relative flex min-h-[240px] w-full flex-col justify-between overflow-hidden rounded-[var(--radius-soft,1.5rem)] p-8 text-left',
          'shadow-[var(--shadow-soft)] transition-shadow hover:shadow-[var(--shadow-soft-lg)]',
          flipped ? 'bg-card' : cn(tone?.bg || 'bg-muted/40', tone?.text)
        )}
      >
        <ScribbleStroke className="pointer-events-none absolute -right-8 -top-10 h-40 w-64 text-current opacity-[0.12]" />

        <div className="relative flex flex-wrap items-center gap-2">
          {current.focus_area && (
            <span className="rounded-full bg-background/70 px-3 py-1 text-xs font-medium shadow-[var(--shadow-soft)]">
              {current.focus_area}
            </span>
          )}
          {current.difficulty && (
            <span className="rounded-full bg-background/70 px-3 py-1 text-xs font-medium capitalize shadow-[var(--shadow-soft)]">
              {current.difficulty}
            </span>
          )}
        </div>

        <p className={cn('relative my-6 text-lg leading-relaxed', !flipped && 'font-semibold')}>
          {flipped ? current.back : current.front}
        </p>

        <span className="relative text-xs opacity-70">
          {flipped ? 'Click to see the question' : 'Click to reveal the answer'}
        </span>
      </button>

      <div className="flex items-center justify-between">
        <button type="button" className={pillClass} onClick={() => go(-1)} disabled={position === 0}>
          <ChevronLeft className="h-4 w-4" /> Previous
        </button>
        <button
          type="button"
          className={pillClass}
          onClick={() => go(1)}
          disabled={position === order.length - 1}
        >
          Next <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default FlashcardDeck;
