import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface MathsQuickCalcProps {
  isActive: boolean;
  onScoreUpdate: (score: number) => void;
}

const generateQuestion = (level: number) => {
  const operations = ['+', '-', '×'];
  const op = operations[Math.floor(Math.random() * operations.length)];
  
  let a: number, b: number, answer: number;
  
  if (level < 3) {
    // Easy: single digit
    a = Math.floor(Math.random() * 9) + 1;
    b = Math.floor(Math.random() * 9) + 1;
  } else if (level < 6) {
    // Medium: teens
    a = Math.floor(Math.random() * 10) + 5;
    b = Math.floor(Math.random() * 10) + 5;
  } else {
    // Hard: larger numbers
    a = Math.floor(Math.random() * 20) + 10;
    b = Math.floor(Math.random() * 20) + 10;
  }
  
  if (op === '+') answer = a + b;
  else if (op === '-') {
    if (a < b) [a, b] = [b, a]; // Ensure positive result
    answer = a - b;
  } else answer = a * b;
  
  return { question: `${a} ${op} ${b}`, answer };
};

export const MathsQuickCalc: React.FC<MathsQuickCalcProps> = ({ isActive, onScoreUpdate }) => {
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [currentQ, setCurrentQ] = useState(generateQuestion(1));
  const [userAnswer, setUserAnswer] = useState('');
  const [timeLeft, setTimeLeft] = useState(8);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);

  useEffect(() => {
    if (!isActive) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // Time's up - wrong answer
          setFeedback('wrong');
          setTimeout(() => {
            setFeedback(null);
            setCurrentQ(generateQuestion(level));
            setUserAnswer('');
            setTimeLeft(8);
          }, 1000);
          return 8;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive, level]);

  const checkAnswer = () => {
    if (!userAnswer) return;
    
    const isCorrect = parseInt(userAnswer) === currentQ.answer;
    setFeedback(isCorrect ? 'correct' : 'wrong');
    
    if (isCorrect) {
      const newScore = score + 1;
      setScore(newScore);
      onScoreUpdate(newScore);
      if (newScore % 3 === 0) setLevel(prev => prev + 1);
    }
    
    setTimeout(() => {
      setFeedback(null);
      setCurrentQ(generateQuestion(level));
      setUserAnswer('');
      setTimeLeft(8);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') checkAnswer();
  };

  if (!isActive) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-md mx-auto p-8 rounded-2xl bg-white shadow-lg border-2 border-orange-200"
    >
      <div className="flex justify-between items-center mb-6">
        <div className="text-sm font-medium text-muted-foreground">
          Score: <span className="text-2xl font-bold text-orange-600">{score}</span>
        </div>
        <div className={`text-lg font-bold ${timeLeft <= 3 ? 'text-red-500' : 'text-green-600'}`}>
          ⏱️ {timeLeft}s
        </div>
      </div>

      <motion.div
        key={currentQ.question}
        initial={{ x: 20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="text-center mb-6"
      >
        <div className="text-5xl font-bold text-foreground mb-4">
          {currentQ.question} = ?
        </div>
      </motion.div>

      <div className="space-y-4">
        <Input
          type="number"
          value={userAnswer}
          onChange={(e) => setUserAnswer(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Your answer..."
          className="text-2xl text-center h-16"
          autoFocus
          disabled={feedback !== null}
        />
        
        <Button 
          onClick={checkAnswer} 
          className="w-full h-12 text-lg"
          disabled={!userAnswer || feedback !== null}
        >
          Submit Answer
        </Button>
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
          {feedback === 'correct' ? '✅ Correct!' : `❌ Wrong! Answer: ${currentQ.answer}`}
        </motion.div>
      )}
    </motion.div>
  );
};
