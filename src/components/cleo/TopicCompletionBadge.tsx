import React, { useEffect, useState } from 'react';
import { Trophy, Award, Star, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import confetti from 'canvas-confetti';

interface TopicCompletionBadgeProps {
  badgeType: 'first_completion' | 'perfect_score' | 'speed_run' | 'consistent_learner';
  earnedAt: string;
  metadata?: {
    score?: number;
    timeMinutes?: number;
    streak?: number;
  };
  showAnimation?: boolean;
}

const badgeConfig = {
  first_completion: {
    icon: Trophy,
    title: 'First Completion',
    emoji: '🎉',
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10',
  },
  perfect_score: {
    icon: Award,
    title: 'Perfect Score',
    emoji: '🏆',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
  },
  speed_run: {
    icon: Zap,
    title: 'Speed Run',
    emoji: '⚡',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  consistent_learner: {
    icon: Star,
    title: 'Consistent Learner',
    emoji: '⭐',
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
  },
};

export const TopicCompletionBadge: React.FC<TopicCompletionBadgeProps> = ({
  badgeType,
  earnedAt,
  metadata,
  showAnimation = false,
}) => {
  const [visible, setVisible] = useState(!showAnimation);
  const config = badgeConfig[badgeType];
  const Icon = config.icon;

  useEffect(() => {
    if (showAnimation) {
      // Trigger confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FFD700', '#FFA500', '#FF6347'],
      });

      // Fade in badge after a short delay
      setTimeout(() => setVisible(true), 300);
    }
  }, [showAnimation]);

  if (!visible && showAnimation) return null;

  return (
    <div className={cn(
      "flex items-center gap-3 p-4 rounded-lg border border-border/50 shadow-sm",
      config.bgColor,
      showAnimation && "animate-scale-in"
    )}>
      {/* Icon */}
      <div className={cn(
        "flex items-center justify-center w-12 h-12 rounded-full bg-background",
        "shadow-inner"
      )}>
        <Icon className={cn("w-6 h-6", config.color)} />
      </div>

      {/* Info */}
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-semibold text-foreground">
            {config.title}
          </h4>
          <span className="text-lg" role="img" aria-label={config.title}>
            {config.emoji}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          Earned {new Date(earnedAt).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            year: 'numeric'
          })}
        </p>
        {metadata && (
          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
            {metadata.score !== undefined && (
              <span>Score: {metadata.score}%</span>
            )}
            {metadata.timeMinutes !== undefined && (
              <span>Time: {metadata.timeMinutes}m</span>
            )}
            {metadata.streak !== undefined && (
              <span>Streak: {metadata.streak} days</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};