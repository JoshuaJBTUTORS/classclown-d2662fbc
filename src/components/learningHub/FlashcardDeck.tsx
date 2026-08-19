import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, RotateCcw, Shuffle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface RevisionCard {
  front: string;
  back: string;
  focus_area?: string;
  difficulty?: 'easy' | 'medium' | 'hard' | string;
}

interface FlashcardDeckProps {
  cards: RevisionCard[];
}

const difficultyStyles: Record<string, string> = {
  easy: 'bg-emerald-100 text-emerald-700',
  medium: 'bg-amber-100 text-amber-700',
  hard: 'bg-rose-100 text-rose-700',
};

const FlashcardDeck: React.FC<FlashcardDeckProps> = ({ cards }) => {
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
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">
          Card {order[position] + 1} of {cards.length}
        </span>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={shuffle}>
            <Shuffle className="h-4 w-4 mr-1.5" /> Shuffle
          </Button>
          <Button variant="ghost" size="sm" onClick={restart}>
            <RotateCcw className="h-4 w-4 mr-1.5" /> Restart
          </Button>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        className={cn(
          'w-full text-left rounded-3xl p-8 min-h-[240px] flex flex-col justify-between',
          'border shadow-sm transition-colors duration-300',
          flipped ? 'bg-primary/5 border-primary/30' : 'bg-card border-border hover:bg-accent/40'
        )}
      >
        <div className="flex items-center gap-2 flex-wrap">
          {current.focus_area && (
            <Badge variant="secondary" className="rounded-full">{current.focus_area}</Badge>
          )}
          {current.difficulty && (
            <Badge
              className={cn(
                'rounded-full border-0 capitalize',
                difficultyStyles[String(current.difficulty).toLowerCase()] || 'bg-muted text-muted-foreground'
              )}
            >
              {current.difficulty}
            </Badge>
          )}
        </div>

        <p className={cn('text-lg leading-relaxed my-6', flipped ? 'text-foreground' : 'font-semibold text-foreground')}>
          {flipped ? current.back : current.front}
        </p>

        <span className="text-xs text-muted-foreground">
          {flipped ? 'Click to see the question' : 'Click to reveal the answer'}
        </span>
      </button>

      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => go(-1)} disabled={position === 0}>
          <ChevronLeft className="h-4 w-4 mr-1" /> Previous
        </Button>
        <Button variant="outline" onClick={() => go(1)} disabled={position === order.length - 1}>
          Next <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
};

export default FlashcardDeck;
