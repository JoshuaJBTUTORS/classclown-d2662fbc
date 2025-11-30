import { supabase } from '@/integrations/supabase/client';

export interface GamificationStats {
  id: string;
  user_id: string;
  current_streak_days: number;
  longest_streak_days: number;
  last_activity_date: string | null;
  level: number;
  total_xp: number;
  total_coins: number;
  energy_percentage: number;
  focus_score: number;
  learning_persona: string;
  created_at: string;
  updated_at: string;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_type: string;
  badge_name: string;
  badge_emoji: string;
  earned_at: string;
  metadata: any; // Using any to match Supabase Json type
}

export interface ActivityLog {
  id: string;
  user_id: string;
  activity_type: string;
  activity_date: string;
  xp_earned: number;
  created_at: string;
}

export const gamificationService = {
  /**
   * Get or create user gamification stats
   */
  async getUserStats(userId: string): Promise<GamificationStats | null> {
    const { data, error } = await supabase
      .from('user_gamification_stats')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching gamification stats:', error);
      return null;
    }

    // If stats don't exist, create them
    if (!data) {
      const { data: newStats, error: insertError } = await supabase
        .from('user_gamification_stats')
        .insert({
          user_id: userId,
          current_streak_days: 0,
          longest_streak_days: 0,
          level: 1,
          total_xp: 0,
          total_coins: 0,
          energy_percentage: 100,
          focus_score: 0,
          learning_persona: 'The Strategist',
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error creating gamification stats:', insertError);
        return null;
      }

      return newStats as GamificationStats;
    }

    return data as GamificationStats;
  },

  /**
   * Get user badges
   */
  async getUserBadges(userId: string): Promise<UserBadge[]> {
    const { data, error } = await supabase
      .from('user_badges')
      .select('*')
      .eq('user_id', userId)
      .order('earned_at', { ascending: false });

    if (error) {
      console.error('Error fetching user badges:', error);
      return [];
    }

    return data || [];
  },

  /**
   * Award a badge to a user
   */
  async awardBadge(
    userId: string,
    badgeType: string,
    badgeName: string,
    badgeEmoji: string,
    metadata?: Record<string, any>
  ): Promise<UserBadge | null> {
    // Check if badge already exists
    const { data: existingBadge } = await supabase
      .from('user_badges')
      .select('*')
      .eq('user_id', userId)
      .eq('badge_type', badgeType)
      .single();

    if (existingBadge) {
      return null; // Badge already awarded
    }

    const { data: badge, error } = await supabase
      .from('user_badges')
      .insert({
        user_id: userId,
        badge_type: badgeType,
        badge_name: badgeName,
        badge_emoji: badgeEmoji,
        metadata: metadata || {},
      })
      .select()
      .single();

    if (error) {
      console.error('Error awarding badge:', error);
      return null;
    }

    return badge;
  },

  async awardCoins(userId: string, coinsToAdd: number): Promise<void> {
    const { getMasteryLevel } = await import('./masterySystem');
    
    // Get current stats
    const stats = await this.getUserStats(userId);
    if (!stats) return;

    const oldCoins = stats.total_coins || 0;
    const newCoins = oldCoins + coinsToAdd;

    // Update coins
    const { error } = await supabase
      .from('user_gamification_stats')
      .update({ 
        total_coins: newCoins,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (error) {
      console.error('Error awarding coins:', error);
      return;
    }

    // Check for mastery level progression
    const oldLevel = getMasteryLevel(oldCoins);
    const newLevel = getMasteryLevel(newCoins);

    if (oldLevel.id !== newLevel.id) {
      // Award mastery badge
      await this.awardBadge(
        userId,
        `mastery_${newLevel.id}`,
        newLevel.name,
        newLevel.emoji,
        { coins: newCoins, level: newLevel.name }
      );
    }
  },

  /**
   * Log user activity and award XP
   */
  async logActivity(
    userId: string,
    activityType: string,
    xpEarned: number = 0
  ): Promise<void> {
    const today = new Date().toISOString().split('T')[0];

    // Insert activity log
    const { error: logError } = await supabase
      .from('user_activity_log')
      .insert({
        user_id: userId,
        activity_type: activityType,
        activity_date: today,
        xp_earned: xpEarned,
      });

    if (logError) {
      console.error('Error logging activity:', logError);
      return;
    }

    // Update stats
    await this.updateStreakAndXP(userId, xpEarned);
  },

  /**
   * Update streak and XP
   */
  async updateStreakAndXP(userId: string, xpToAdd: number = 0): Promise<void> {
    const stats = await this.getUserStats(userId);
    if (!stats) return;

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    let newStreakDays = stats.current_streak_days;
    let newLongestStreak = stats.longest_streak_days;

    // Check if activity was today or yesterday
    if (!stats.last_activity_date || stats.last_activity_date === today) {
      // Same day, no streak change
      newStreakDays = stats.current_streak_days || 1;
    } else if (stats.last_activity_date === yesterday) {
      // Consecutive day
      newStreakDays = stats.current_streak_days + 1;
    } else {
      // Streak broken, start new
      newStreakDays = 1;
    }

    // Update longest streak if current is higher
    if (newStreakDays > newLongestStreak) {
      newLongestStreak = newStreakDays;
    }

    // Calculate new level (100 XP per level)
    const newXP = stats.total_xp + xpToAdd;
    const newLevel = Math.floor(newXP / 100) + 1;

    // Update stats
    const { error } = await supabase
      .from('user_gamification_stats')
      .update({
        current_streak_days: newStreakDays,
        longest_streak_days: newLongestStreak,
        last_activity_date: today,
        total_xp: newXP,
        level: newLevel,
      })
      .eq('user_id', userId);

    if (error) {
      console.error('Error updating gamification stats:', error);
    }

    // Award streak badges
    if (newStreakDays === 5 && newStreakDays > stats.current_streak_days) {
      await this.awardBadge(userId, '5_day_streak', '5-Day Streak', '🔥');
    }
    if (newStreakDays === 30 && newStreakDays > stats.current_streak_days) {
      await this.awardBadge(userId, '30_day_streak', 'Consistency Champ', '🏆');
    }
  },

  /**
   * Calculate level from XP (100 XP per level)
   */
  calculateLevel(xp: number): number {
    return Math.floor(xp / 100) + 1;
  },

  /**
   * Get XP needed for next level
   */
  getXPForNextLevel(currentXP: number): number {
    const currentLevel = this.calculateLevel(currentXP);
    return currentLevel * 100;
  },

  /**
   * Get learning persona based on patterns
   */
  getLearningPersona(stats: GamificationStats): string {
    // This can be enhanced with more sophisticated logic
    if (stats.current_streak_days >= 30) {
      return 'The Consistent One';
    } else if (stats.focus_score >= 80) {
      return 'The Focused';
    } else if (stats.level >= 10) {
      return 'The Experienced';
    } else {
      return 'The Strategist';
    }
  },
};
