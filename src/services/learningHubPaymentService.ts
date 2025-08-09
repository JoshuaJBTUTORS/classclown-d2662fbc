
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

  // Create Learning Hub subscription (redirect-based)
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

  // Create Learning Hub payment intent for embedded checkout
  createLearningHubPaymentIntent: async (): Promise<{ 
    clientSecret: string; 
    customerId: string; 
    trialEligible: boolean;
    amount: number;
  }> => {
    console.log('Creating Learning Hub payment intent for embedded checkout');
    
    try {
      const { data, error } = await supabase.functions.invoke('create-learning-hub-payment-intent');
      
      if (error) {
        console.error('Payment intent creation error:', error);
        throw error;
      }
      
      console.log('Learning Hub payment intent created successfully');
      return data;
    } catch (error) {
      console.error('Learning Hub payment intent service error:', error);
      throw error;
    }
  },

  // Complete Learning Hub subscription setup after payment
  completeLearningHubSubscription: async (setupIntentId: string): Promise<{ success: boolean; message?: string }> => {
    console.log('Completing Learning Hub subscription setup');
    
    try {
      const { data, error } = await supabase.functions.invoke('complete-learning-hub-subscription', {
        body: { setupIntentId }
      });
      
      if (error) {
        console.error('Subscription completion error:', error);
        throw error;
      }
      
      console.log('Learning Hub subscription completed successfully');
      return data;
    } catch (error) {
      console.error('Learning Hub subscription completion service error:', error);
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
      const accessInfo = await learningHubPaymentService.checkLearningHubAccess();
      
      if (!accessInfo) {
        return {
          hasActiveSubscription: false,
          needsPaymentUpdate: false,
          gracePeriodInfo: {
            isInGracePeriod: false
          }
        };
      }
      
      const gracePeriodInfo = (accessInfo.isInGracePeriod === true) ? {
        isInGracePeriod: true,
        gracePeriodEnd: accessInfo.gracePeriodEnd || undefined,
        daysRemaining: accessInfo.gracePeriodEnd 
          ? Math.ceil((new Date(accessInfo.gracePeriodEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          : 0
      } : {
        isInGracePeriod: false
      };

      return {
        hasActiveSubscription: accessInfo.hasAccess || false,
        subscription: accessInfo.subscription,
        needsPaymentUpdate: (accessInfo.isInGracePeriod === true) || false,
        gracePeriodInfo: gracePeriodInfo
      };
    } catch (error) {
      console.error('Error getting subscription status:', error);
      return {
        hasActiveSubscription: false,
        needsPaymentUpdate: false,
        gracePeriodInfo: {
          isInGracePeriod: false
        }
      };
    }
  }
};
