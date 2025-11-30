import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface EnglishWordScrambleProps {
  isActive: boolean;
  onScoreUpdate: (score: number) => void;
}

const WORDS = [
  { word: 'PLOT', hint: 'The sequence of story events' },
  { word: 'POEM', hint: 'Verse writing with rhythm' },
  { word: 'THEME', hint: 'Main idea or message' },
  { word: 'TONE', hint: 'Author\'s attitude' },
  { word: 'MOOD', hint: 'How the reader feels' },
  { word: 'GENRE', hint: 'Type of literature' },
  { word: 'SCENE', hint: 'Part of a play or story' },
  { word: 'PROSE', hint: 'Ordinary written language' },
  { word: 'MYTH', hint: 'Traditional story' },
  { word: 'HERO', hint: 'Main good character' },
  { word: 'STANZA', hint: 'Group of lines in a poem' },
  { word: 'SIMILE', hint: 'Comparison using like/as' },
  { word: 'SYMBOL', hint: 'Object representing an idea' },
  { word: 'RHYME', hint: 'Similar ending sounds' },
  { word: 'IRONY', hint: 'Opposite of expected' },
  { word: 'SATIRE', hint: 'Mocking to criticize' },
  { word: 'FABLE', hint: 'Story with a moral' },
  { word: 'DRAMA', hint: 'Play or theatre' },
  { word: 'ESSAY', hint: 'Short written piece' },
  { word: 'VERSE', hint: 'Line of poetry' },
];

const scramble = (word: string) => {
  const arr = word.split('');
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.join('');
};

export const EnglishWordScramble: React.FC<EnglishWordScrambleProps> = ({ isActive, onScoreUpdate }) => {
  const [score, setScore] = useState(0);
  const [currentWord, setCurrentWord] = useState(WORDS[0]);
  const [scrambled, setScrambled] = useState(scramble(WORDS[0].word));
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [timeElapsed, setTimeElapsed] = useState(0);

  useEffect(() => {
    if (!isActive) return;
    
    const timer = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive]);

  const nextWord = () => {
    const newWord = WORDS[Math.floor(Math.random() * WORDS.length)];
    let newScrambled = scramble(newWord.word);
    
    // Ensure scrambled is different from original
    while (newScrambled === newWord.word) {
      newScrambled = scramble(newWord.word);
    }
    
    setCurrentWord(newWord);
    setScrambled(newScrambled);
    setUserAnswer('');
    setTimeElapsed(0);
    setFeedback(null);
  };

  const checkAnswer = () => {
    if (!userAnswer) return;
    
    const isCorrect = userAnswer.toUpperCase() === currentWord.word;
    setFeedback(isCorrect ? 'correct' : 'wrong');
    
    if (isCorrect) {
      const newScore = score + 1;
      setScore(newScore);
      onScoreUpdate(newScore);
    }
    
    setTimeout(nextWord, 1500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') checkAnswer();
  };

  if (!isActive) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-md mx-auto p-8 rounded-2xl bg-white shadow-lg border-2 border-rose-200"
    >
      <div className="flex justify-between items-center mb-6">
        <div className="text-sm font-medium text-muted-foreground">
          Score: <span className="text-2xl font-bold text-rose-600">{score}</span>
        </div>
        <div className="text-sm text-muted-foreground">
          Time: {timeElapsed}s
        </div>
      </div>

      <div className="text-center mb-2 text-sm font-medium text-muted-foreground">
        Unscramble this word:
      </div>

      <motion.div
        key={scrambled}
        initial={{ x: 20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="text-center mb-4"
      >
        <div className="text-sm text-muted-foreground mb-2">
          First letter: <span className="font-bold text-rose-600">{currentWord.word[0]}</span>
        </div>
        <div className="text-4xl font-bold text-foreground tracking-wider mb-2">
          {scrambled}
        </div>
      </motion.div>

      <div className="text-center mb-4 text-sm text-amber-700 bg-amber-50 p-2 rounded">
        💡 {currentWord.hint}
      </div>

      <div className="space-y-4">
        <Input
          type="text"
          value={userAnswer}
          onChange={(e) => setUserAnswer(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type the word..."
          className="text-2xl text-center h-16 uppercase"
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
          {feedback === 'correct' ? '✅ Correct!' : `❌ Wrong! Answer: ${currentWord.word}`}
        </motion.div>
      )}
    </motion.div>
  );
};
