
import { supabase } from '@/integrations/supabase/client';

export const learningHubPaymentService = {
  // Check if user is eligible for a free trial
  checkTrialEligibility: async (): Promise<{ eligible: boolean; reason?: string }> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { eligible: false, reason: "User not authenticated" };
    }

    console.log('Checking trial eligibility for Learning Hub');

    try {
      const { data, error } = await supabase.functions.invoke('check-learning-hub-access');
      
      if (error) {
        console.error('Error checking trial eligibility:', error);
        return { eligible: false, reason: "Error checking trial status" };
      }

      return { 
        eligible: data.trialEligible, 
        reason: data.trialEligible ? undefined : "You have already used your free trial for Learning Hub access."
      };
    } catch (error) {
      console.error('Trial eligibility service error:', error);
      return { eligible: false, reason: "Unable to check trial eligibility" };
    }
  },

  // Create Learning Hub subscription
  createLearningHubSubscription: async (): Promise<{ url: string }> => {
    console.log('Creating Learning Hub subscription');
    
    try {
      const { data, error } = await supabase.functions.invoke('create-learning-hub-subscription');
      
      if (error) {
        console.error('Subscription creation error:', error);
        throw error;
      }
      
      console.log('Learning Hub subscription created successfully');
      return data;
    } catch (error) {
      console.error('Learning Hub subscription service error:', error);
      throw error;
    }
  },

  // Check Learning Hub access
  checkLearningHubAccess: async (): Promise<{
    hasAccess: boolean;
    subscription?: any;
    trialEligible: boolean;
    isInGracePeriod?: boolean;
    gracePeriodEnd?: string;
  }> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { hasAccess: false, trialEligible: true };

    console.log('Checking Learning Hub access for user:', user.id);

    try {
      const { data, error } = await supabase.functions.invoke('check-learning-hub-access');
      
      if (error) {
        console.error('Error checking Learning Hub access:', error);
        return { hasAccess: false, trialEligible: true };
      }
      
      console.log('Learning Hub access check result:', data);
      return data;
    } catch (error) {
      console.error('Learning Hub access service error:', error);
      return { hasAccess: false, trialEligible: true };
    }
  },

  // Create customer portal session for subscription management
  createCustomerPortal: async (): Promise<{ url: string }> => {
    console.log('Creating customer portal session');
    
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      
      if (error) {
        console.error('Customer portal creation error:', error);
        throw error;
      }
      
      console.log('Customer portal session created successfully');
      return data;
    } catch (error) {
      console.error('Customer portal service error:', error);
      throw error;
    }
  },

  // Get subscription status
  getSubscriptionStatus: async (): Promise<{
    hasActiveSubscription: boolean;
    subscription?: any;
    needsPaymentUpdate: boolean;
    gracePeriodInfo?: {
      isInGracePeriod: boolean;
      gracePeriodEnd?: string;
      daysRemaining?: number;
    };
  }> => {
    try {
      const accessInfo = await this.checkLearningHubAccess();
      
      const gracePeriodInfo = accessInfo.isInGracePeriod ? {
        isInGracePeriod: true,
        gracePeriodEnd: accessInfo.gracePeriodEnd,
        daysRemaining: accessInfo.gracePeriodEnd 
          ? Math.ceil((new Date(accessInfo.gracePeriodEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          : 0
      } : undefined;

      return {
        hasActiveSubscription: accessInfo.hasAccess,
        subscription: accessInfo.subscription,
        needsPaymentUpdate: accessInfo.isInGracePeriod || false,
        gracePeriodInfo
      };
    } catch (error) {
      console.error('Error getting subscription status:', error);
      return {
        hasActiveSubscription: false,
        needsPaymentUpdate: false
      };
    }
  }
};
