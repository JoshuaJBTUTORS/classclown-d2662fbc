import { supabase } from "@/integrations/supabase/client";
import type { OnboardingData, OnboardingProfile } from "@/types/onboarding";

export const onboardingService = {
  /**
   * Complete user onboarding and save profile data
   */
  async completeOnboarding(userId: string, data: OnboardingData): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        region: data.region,
        curriculum: data.curriculum,
        year_group_id: data.yearGroupId,
        preferred_subjects: data.subjects,
        onboarding_completed: true,
        onboarding_completed_at: new Date().toISOString(),
      }, { onConflict: 'id' })
      .select('id')
      .single();

    if (error) {
      console.error('Error completing onboarding:', error);
      throw error;
    }
  },

  /**
   * Check if user has completed onboarding
   */
  async hasCompletedOnboarding(userId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error checking onboarding status:', error);
      return false;
    }

    return data?.onboarding_completed || false;
  },

  /**
   * Get user's onboarding profile
   */
  async getOnboardingProfile(userId: string): Promise<OnboardingProfile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('region, curriculum, year_group_id, preferred_subjects, onboarding_completed, onboarding_completed_at')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching onboarding profile:', error);
      return null;
    }

    return {
      region: data.region as any,
      curriculum: data.curriculum as any,
      yearGroupId: data.year_group_id,
      preferredSubjects: data.preferred_subjects || [],
      onboardingCompleted: data.onboarding_completed || false,
      onboardingCompletedAt: data.onboarding_completed_at,
    };
  },

  /**
   * Update user's subjects
   */
  async updateSubjects(userId: string, subjects: string[]): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update({
        preferred_subjects: subjects,
      })
      .eq('id', userId);

    if (error) {
      console.error('Error updating subjects:', error);
      throw error;
    }
  },
};
