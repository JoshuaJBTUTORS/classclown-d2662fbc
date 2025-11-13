export interface MasteryLevel {
  id: string;
  name: string;
  emoji: string;
  minCoins: number;
  maxCoins: number;
  color: string;
}

export const MASTERY_LEVELS: MasteryLevel[] = [
  {
    id: 'noob',
    name: 'Noob',
    emoji: '🐣',
    minCoins: 0,
    maxCoins: 9,
    color: 'from-gray-400 to-gray-500'
  },
  {
    id: 'beginner',
    name: 'Beginner',
    emoji: '🌱',
    minCoins: 10,
    maxCoins: 49,
    color: 'from-green-400 to-green-500'
  },
  {
    id: 'apprentice',
    name: 'Apprentice',
    emoji: '📚',
    minCoins: 50,
    maxCoins: 99,
    color: 'from-blue-400 to-blue-500'
  },
  {
    id: 'scholar',
    name: 'Scholar',
    emoji: '🎓',
    minCoins: 100,
    maxCoins: 249,
    color: 'from-purple-400 to-purple-500'
  },
  {
    id: 'expert',
    name: 'Expert',
    emoji: '⭐',
    minCoins: 250,
    maxCoins: 499,
    color: 'from-yellow-400 to-yellow-500'
  },
  {
    id: 'master',
    name: 'Master',
    emoji: '🏆',
    minCoins: 500,
    maxCoins: 999,
    color: 'from-orange-400 to-orange-500'
  },
  {
    id: 'legend',
    name: 'Legend',
    emoji: '💎',
    minCoins: 1000,
    maxCoins: 4999,
    color: 'from-cyan-400 to-cyan-500'
  },
  {
    id: 'grandmaster',
    name: 'Grand Master',
    emoji: '👑',
    minCoins: 5000,
    maxCoins: 999999,
    color: 'from-pink-400 to-pink-500'
  },
];

export const getMasteryLevel = (coins: number): MasteryLevel => {
  return MASTERY_LEVELS.find(
    level => coins >= level.minCoins && coins <= level.maxCoins
  ) || MASTERY_LEVELS[0];
};

export const getNextMasteryLevel = (coins: number): MasteryLevel | null => {
  const currentLevel = getMasteryLevel(coins);
  const currentIndex = MASTERY_LEVELS.findIndex(l => l.id === currentLevel.id);
  return MASTERY_LEVELS[currentIndex + 1] || null;
};

export const getMasteryProgress = (coins: number): number => {
  const currentLevel = getMasteryLevel(coins);
  const coinsInLevel = coins - currentLevel.minCoins;
  const levelRange = currentLevel.maxCoins - currentLevel.minCoins + 1;
  return Math.round((coinsInLevel / levelRange) * 100);
};
