import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface DefaultMemoryMatchProps {
  isActive: boolean;
  onScoreUpdate: (score: number) => void;
}

const EMOJIS = ['📚', '🧠', '✏️', '📝', '🎓', '📖', '🔬', '🧪'];

interface Card {
  id: number;
  emoji: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const initializeCards = (): Card[] => {
  const pairs = EMOJIS.slice(0, 6).flatMap((emoji, idx) => [
    { id: idx * 2, emoji, isFlipped: false, isMatched: false },
    { id: idx * 2 + 1, emoji, isFlipped: false, isMatched: false }
  ]);
  return pairs.sort(() => Math.random() - 0.5);
};

export const DefaultMemoryMatch: React.FC<DefaultMemoryMatchProps> = ({ isActive, onScoreUpdate }) => {
  const [cards, setCards] = useState<Card[]>(initializeCards());
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(0);

  useEffect(() => {
    if (!isActive) return;
    
    if (flippedIndices.length === 2) {
      const [first, second] = flippedIndices;
      
      if (cards[first].emoji === cards[second].emoji) {
        // Match found
        setTimeout(() => {
          setCards(prev => prev.map((card, idx) =>
            idx === first || idx === second ? { ...card, isMatched: true } : card
          ));
          const newScore = score + 1;
          setScore(newScore);
          onScoreUpdate(newScore);
          setFlippedIndices([]);
        }, 500);
      } else {
        // No match
        setTimeout(() => {
          setCards(prev => prev.map((card, idx) =>
            idx === first || idx === second ? { ...card, isFlipped: false } : card
          ));
          setFlippedIndices([]);
        }, 1000);
      }
    }
  }, [flippedIndices, cards, score]);

  const handleCardClick = (index: number) => {
    if (
      flippedIndices.length === 2 ||
      cards[index].isFlipped ||
      cards[index].isMatched ||
      flippedIndices.includes(index)
    ) {
      return;
    }

    setCards(prev => prev.map((card, idx) =>
      idx === index ? { ...card, isFlipped: true } : card
    ));
    
    setFlippedIndices(prev => {
      const newFlipped = [...prev, index];
      if (newFlipped.length === 2) setMoves(m => m + 1);
      return newFlipped;
    });
  };

  if (!isActive) return null;

  const allMatched = cards.every(card => card.isMatched);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-md mx-auto p-8 rounded-2xl bg-white shadow-lg border-2 border-indigo-200"
    >
      <div className="flex justify-between items-center mb-6">
        <div className="text-sm font-medium text-muted-foreground">
          Matches: <span className="text-2xl font-bold text-indigo-600">{score}</span>
        </div>
        <div className="text-sm text-muted-foreground">
          Moves: {moves}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-4">
        {cards.map((card, index) => (
          <motion.button
            key={card.id}
            onClick={() => handleCardClick(index)}
            className={`aspect-square rounded-lg flex items-center justify-center text-3xl font-bold transition-all ${
              card.isMatched
                ? 'bg-green-100 border-2 border-green-400'
                : card.isFlipped
                ? 'bg-white border-2 border-indigo-400'
                : 'bg-indigo-500 border-2 border-indigo-600 hover:bg-indigo-400'
            }`}
            whileHover={{ scale: card.isMatched ? 1 : 1.05 }}
            whileTap={{ scale: card.isMatched ? 1 : 0.95 }}
            disabled={card.isMatched}
          >
            {card.isFlipped || card.isMatched ? card.emoji : '?'}
          </motion.button>
        ))}
      </div>

      {allMatched && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="p-4 rounded-lg bg-green-100 text-green-700 text-center font-bold"
        >
          🎉 All matched! Great memory!
        </motion.div>
      )}
    </motion.div>
  );
};
