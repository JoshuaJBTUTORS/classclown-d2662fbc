import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ComputerScienceBinaryBlitzProps {
  isActive: boolean;
  onScoreUpdate: (score: number) => void;
}

const generateQuestion = (level: number) => {
  const isToBinary = Math.random() > 0.5;
  let number: number;
  
  if (level < 3) number = Math.floor(Math.random() * 16); // 0-15
  else if (level < 6) number = Math.floor(Math.random() * 32); // 0-31
  else number = Math.floor(Math.random() * 64); // 0-63
  
  if (isToBinary) {
    return {
      question: `Convert ${number} to binary`,
      answer: number.toString(2),
      type: 'toBinary' as const
    };
  } else {
    const binary = number.toString(2);
    return {
      question: `Convert ${binary} to decimal`,
      answer: number.toString(),
      type: 'toDecimal' as const
    };
  }
};

export const ComputerScienceBinaryBlitz: React.FC<ComputerScienceBinaryBlitzProps> = ({ 
  isActive, 
  onScoreUpdate 
}) => {
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [currentQ, setCurrentQ] = useState(generateQuestion(1));
  const [userAnswer, setUserAnswer] = useState('');
  const [timeLeft, setTimeLeft] = useState(10);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);

  useEffect(() => {
    if (!isActive) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setFeedback('wrong');
          setTimeout(() => {
            setFeedback(null);
            setCurrentQ(generateQuestion(level));
            setUserAnswer('');
            setTimeLeft(10);
          }, 1000);
          return 10;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive, level]);

  const checkAnswer = () => {
    if (!userAnswer) return;
    
    const isCorrect = userAnswer.trim() === currentQ.answer;
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
      setTimeLeft(10);
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
      className="w-full max-w-md mx-auto p-8 rounded-2xl bg-white shadow-lg border-2 border-slate-200"
    >
      <div className="flex justify-between items-center mb-6">
        <div className="text-sm font-medium text-muted-foreground">
          Score: <span className="text-2xl font-bold text-slate-600">{score}</span>
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
        <div className="text-3xl font-bold text-foreground mb-2">
          {currentQ.question}
        </div>
        <div className="text-sm text-muted-foreground">
          {currentQ.type === 'toBinary' ? '(Enter in binary: 0s and 1s)' : '(Enter as a number)'}
        </div>
      </motion.div>

      <div className="space-y-4">
        <Input
          type="text"
          value={userAnswer}
          onChange={(e) => {
            const value = e.target.value;
            if (currentQ.type === 'toBinary') {
              if (/^[01]*$/.test(value)) setUserAnswer(value);
            } else {
              if (/^\d*$/.test(value)) setUserAnswer(value);
            }
          }}
          onKeyPress={handleKeyPress}
          placeholder={currentQ.type === 'toBinary' ? '1010...' : '42...'}
          className="text-2xl text-center h-16 font-mono"
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
