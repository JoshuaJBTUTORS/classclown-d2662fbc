import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { gamificationService, GamificationStats, UserBadge } from '@/services/gamificationService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const useGamification = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
  } = useQuery<GamificationStats | null>({
    queryKey: ['gamification-stats', user?.id],
    queryFn: () => (user?.id ? gamificationService.getUserStats(user.id) : null),
    enabled: !!user?.id,
  });

  const {
    data: badges,
    isLoading: badgesLoading,
  } = useQuery<UserBadge[]>({
    queryKey: ['user-badges', user?.id],
    queryFn: () => (user?.id ? gamificationService.getUserBadges(user.id) : []),
    enabled: !!user?.id,
  });

  const logActivityMutation = useMutation({
    mutationFn: ({
      activityType,
      xpEarned,
    }: {
      activityType: string;
      xpEarned?: number;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');
      return gamificationService.logActivity(user.id, activityType, xpEarned);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gamification-stats'] });
      queryClient.invalidateQueries({ queryKey: ['user-badges'] });
    },
    onError: (error) => {
      console.error('Error logging activity:', error);
      toast.error('Failed to log activity');
    },
  });

  const awardBadgeMutation = useMutation({
    mutationFn: ({
      badgeType,
      badgeName,
      badgeEmoji,
      metadata,
    }: {
      badgeType: string;
      badgeName: string;
      badgeEmoji: string;
      metadata?: Record<string, any>;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');
      return gamificationService.awardBadge(
        user.id,
        badgeType,
        badgeName,
        badgeEmoji,
        metadata
      );
    },
    onSuccess: (badge) => {
      if (badge) {
        toast.success(`Badge earned: ${badge.badge_emoji} ${badge.badge_name}`);
        queryClient.invalidateQueries({ queryKey: ['user-badges'] });
      }
    },
    onError: (error) => {
      console.error('Error awarding badge:', error);
    },
  });

  return {
    stats,
    badges,
    isLoading: statsLoading || badgesLoading,
    error: statsError,
    logActivity: logActivityMutation.mutate,
    awardBadge: awardBadgeMutation.mutate,
  };
};
