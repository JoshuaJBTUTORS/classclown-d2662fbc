import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

interface ScienceElementMatchProps {
  isActive: boolean;
  onScoreUpdate: (score: number) => void;
}

const ELEMENTS = [
  { symbol: 'H', name: 'Hydrogen' },
  { symbol: 'He', name: 'Helium' },
  { symbol: 'C', name: 'Carbon' },
  { symbol: 'N', name: 'Nitrogen' },
  { symbol: 'O', name: 'Oxygen' },
  { symbol: 'Na', name: 'Sodium' },
  { symbol: 'Mg', name: 'Magnesium' },
  { symbol: 'Al', name: 'Aluminium' },
  { symbol: 'Cl', name: 'Chlorine' },
  { symbol: 'K', name: 'Potassium' },
  { symbol: 'Ca', name: 'Calcium' },
  { symbol: 'Fe', name: 'Iron' },
  { symbol: 'Cu', name: 'Copper' },
  { symbol: 'Zn', name: 'Zinc' },
  { symbol: 'Ag', name: 'Silver' },
  { symbol: 'Au', name: 'Gold' },
];

export const ScienceElementMatch: React.FC<ScienceElementMatchProps> = ({ isActive, onScoreUpdate }) => {
  const [score, setScore] = useState(0);
  const [currentElement, setCurrentElement] = useState(ELEMENTS[0]);
  const [options, setOptions] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

  const generateQuestion = () => {
    const element = ELEMENTS[Math.floor(Math.random() * ELEMENTS.length)];
    const wrongAnswers = ELEMENTS
      .filter(e => e.symbol !== element.symbol)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map(e => e.name);
    
    const allOptions = [...wrongAnswers, element.name].sort(() => Math.random() - 0.5);
    
    setCurrentElement(element);
    setOptions(allOptions);
    setFeedback(null);
    setSelectedAnswer(null);
  };

  useEffect(() => {
    if (isActive) generateQuestion();
  }, [isActive]);

  const checkAnswer = (answer: string) => {
    if (feedback !== null) return;
    
    setSelectedAnswer(answer);
    const isCorrect = answer === currentElement.name;
    setFeedback(isCorrect ? 'correct' : 'wrong');
    
    if (isCorrect) {
      const newScore = score + 1;
      setScore(newScore);
      onScoreUpdate(newScore);
    }
    
    setTimeout(generateQuestion, 1500);
  };

  if (!isActive) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-md mx-auto p-8 rounded-2xl bg-white shadow-lg border-2 border-teal-200"
    >
      <div className="text-center mb-6">
        <div className="text-sm font-medium text-muted-foreground mb-2">
          Score: <span className="text-2xl font-bold text-teal-600">{score}</span>
        </div>
      </div>

      <div className="text-center mb-2 text-sm font-medium text-muted-foreground">
        What element is this?
      </div>

      <motion.div
        key={currentElement.symbol}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="mb-8"
      >
        <div className="mx-auto w-32 h-32 flex items-center justify-center bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl shadow-lg">
          <span className="text-6xl font-bold text-white">{currentElement.symbol}</span>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 gap-3">
        {options.map((option, idx) => (
          <Button
            key={idx}
            onClick={() => checkAnswer(option)}
            disabled={feedback !== null}
            variant={
              selectedAnswer === option
                ? feedback === 'correct'
                  ? 'default'
                  : 'destructive'
                : 'outline'
            }
            className="h-14 text-lg"
          >
            {option}
          </Button>
        ))}
      </div>

      {feedback && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className={`mt-4 p-4 rounded-lg text-center font-bold text-lg ${
            feedback === 'correct' 
              ? 'bg-green-100 text-green-700' 
              : 'bg-red-100 text-red-700'
          }`}
        >
          {feedback === 'correct' ? '✅ Correct!' : `❌ Wrong! Answer: ${currentElement.name}`}
        </motion.div>
      )}
    </motion.div>
  );
};
