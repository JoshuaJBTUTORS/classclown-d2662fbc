import React, { useState } from 'react';
import { MathsQuickCalc } from './MathsQuickCalc';
import { EnglishWordScramble } from './EnglishWordScramble';
import { ScienceElementMatch } from './ScienceElementMatch';
import { ComputerScienceBinaryBlitz } from './ComputerScienceBinaryBlitz';
import { DefaultMemoryMatch } from './DefaultMemoryMatch';

interface MiniGameSelectorProps {
  topic: string;
  yearGroup: string;
  isActive: boolean;
  onScoreUpdate?: (score: number) => void;
}

const getGameComponent = (topic: string, yearGroup: string) => {
  const text = `${topic} ${yearGroup}`.toLowerCase();
  
  // Determine subject area
  if (text.includes('math') || text.includes('algebra') || text.includes('geometry') || text.includes('quadratic')) {
    return { Component: MathsQuickCalc, title: '🧮 Quick Maths Challenge', color: 'orange' };
  }
  
  if (text.includes('english') || text.includes('literature') || text.includes('language')) {
    return { Component: EnglishWordScramble, title: '📚 Word Scramble', color: 'rose' };
  }
  
  if (text.includes('science') || text.includes('biology') || text.includes('chemistry') || text.includes('physics')) {
    return { Component: ScienceElementMatch, title: '🔬 Element Match', color: 'teal' };
  }
  
  if (text.includes('computer') || text.includes('coding') || text.includes('programming')) {
    return { Component: ComputerScienceBinaryBlitz, title: '💻 Binary Blitz', color: 'slate' };
  }
  
  // Default fallback
  return { Component: DefaultMemoryMatch, title: '🎮 Memory Match', color: 'indigo' };
};

export const MiniGameSelector: React.FC<MiniGameSelectorProps> = ({ 
  topic, 
  yearGroup, 
  isActive,
  onScoreUpdate 
}) => {
  const [currentScore, setCurrentScore] = useState(0);
  
  const handleScoreUpdate = (score: number) => {
    setCurrentScore(score);
    onScoreUpdate?.(score);
  };
  
  const { Component, title } = getGameComponent(topic, yearGroup);

  return (
    <div className="w-full">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-foreground mb-2">{title}</h2>
        <p className="text-sm text-muted-foreground">
          Play while your lesson is being prepared!
        </p>
      </div>
      
      <Component isActive={isActive} onScoreUpdate={handleScoreUpdate} />
    </div>
  );
};
