// Mastery System for HeyCleo Gamification

export interface MasteryLevel {
  name: string;
  minCoins: number;
  emoji: string;
  color: string;
}

export const MASTERY_LEVELS: MasteryLevel[] = [
  { name: 'Noob', minCoins: 0, emoji: '🌱', color: '#9CA3AF' },
  { name: 'Beginner', minCoins: 50, emoji: '🌿', color: '#10B981' },
  { name: 'Apprentice', minCoins: 150, emoji: '📚', color: '#3B82F6' },
  { name: 'Scholar', minCoins: 350, emoji: '🎓', color: '#8B5CF6' },
  { name: 'Expert', minCoins: 700, emoji: '⭐', color: '#F59E0B' },
  { name: 'Master', minCoins: 1200, emoji: '💎', color: '#06B6D4' },
  { name: 'Legend', minCoins: 2000, emoji: '👑', color: '#EF4444' },
  { name: 'Grand Master', minCoins: 3500, emoji: '🏆', color: '#F97316' },
];

export const getMasteryLevel = (totalCoins: number): MasteryLevel => {
  // Find the highest level the user qualifies for
  for (let i = MASTERY_LEVELS.length - 1; i >= 0; i--) {
    if (totalCoins >= MASTERY_LEVELS[i].minCoins) {
      return MASTERY_LEVELS[i];
    }
  }
  return MASTERY_LEVELS[0];
};

export const getNextMasteryLevel = (totalCoins: number): MasteryLevel | null => {
  const currentLevel = getMasteryLevel(totalCoins);
  const currentIndex = MASTERY_LEVELS.findIndex(l => l.name === currentLevel.name);
  
  if (currentIndex < MASTERY_LEVELS.length - 1) {
    return MASTERY_LEVELS[currentIndex + 1];
  }
  
  return null; // Already at max level
};

export const getMasteryProgress = (totalCoins: number): number => {
  const currentLevel = getMasteryLevel(totalCoins);
  const nextLevel = getNextMasteryLevel(totalCoins);
  
  if (!nextLevel) {
    return 100; // Max level reached
  }
  
  const coinsInCurrentLevel = totalCoins - currentLevel.minCoins;
  const coinsNeededForNext = nextLevel.minCoins - currentLevel.minCoins;
  
  return Math.min(100, Math.round((coinsInCurrentLevel / coinsNeededForNext) * 100));
};

export const getCoinsToNextLevel = (totalCoins: number): number => {
  const nextLevel = getNextMasteryLevel(totalCoins);
  
  if (!nextLevel) {
    return 0; // Max level reached
  }
  
  return nextLevel.minCoins - totalCoins;
};

export const calculateCoinsFromAnswer = (isCorrect: boolean, marksAwarded?: number, maxMarks?: number): number => {
  if (!isCorrect) return 0;
  
  // If we have marking info, calculate based on percentage
  if (marksAwarded !== undefined && maxMarks !== undefined && maxMarks > 0) {
    const percentage = (marksAwarded / maxMarks) * 100;
    if (percentage >= 75) return 2;
    if (percentage >= 50) return 1;
    return 0;
  }
  
  // Default: 2 coins for correct answer
  return 2;
};

export const calculateXPFromLesson = (
  questionsCorrect: number,
  totalQuestions: number,
  completionPercentage: number
): number => {
  // Base XP for completion
  let xp = Math.round(completionPercentage * 0.5);
  
  // Bonus XP for correct answers
  if (totalQuestions > 0) {
    const accuracyBonus = Math.round((questionsCorrect / totalQuestions) * 50);
    xp += accuracyBonus;
  }
  
  // Perfect lesson bonus
  if (questionsCorrect === totalQuestions && totalQuestions > 0) {
    xp += 25;
  }
  
  return xp;
};

export const calculateLevel = (totalXP: number): number => {
  // Simple level calculation: level = floor(sqrt(xp / 100)) + 1
  return Math.floor(Math.sqrt(totalXP / 100)) + 1;
};

export const getXPForLevel = (level: number): number => {
  // XP needed to reach a specific level
  return Math.pow(level - 1, 2) * 100;
};

export const getXPToNextLevel = (totalXP: number): number => {
  const currentLevel = calculateLevel(totalXP);
  const nextLevelXP = getXPForLevel(currentLevel + 1);
  return nextLevelXP - totalXP;
};
