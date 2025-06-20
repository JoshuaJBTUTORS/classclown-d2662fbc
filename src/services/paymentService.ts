
import { supabase } from '@/integrations/supabase/client';
import { CoursePurchase } from '@/types/course';

export const paymentService = {
  // Create a payment intent for embedded checkout
  createPaymentIntent: async (courseId: string): Promise<{ 
    client_secret: string; 
    customer_id: string; 
    course_title: string; 
    amount: number; 
  }> => {
    console.log('Creating payment intent for embedded checkout:', courseId);
    
    try {
      const { data, error } = await supabase.functions.invoke('create-payment-intent', {
        body: { courseId }
      });
      
      if (error) {
        console.error('Payment intent creation error:', error);
        throw error;
      }
      
      console.log('Payment intent created successfully');
      return data;
    } catch (error) {
      console.error('Payment intent service error:', error);
      throw error;
    }
  },

  // Complete subscription setup after payment method is confirmed
  completeSubscriptionSetup: async (setupIntentId: string): Promise<{ success: boolean; message: string }> => {
    console.log('Completing subscription setup:', setupIntentId);
    
    try {
      const { data, error } = await supabase.functions.invoke('complete-subscription', {
        body: { setupIntentId }
      });
      
      if (error) {
        console.error('Subscription completion error:', error);
        throw error;
      }
      
      console.log('Subscription setup completed successfully');
      return data;
    } catch (error) {
      console.error('Subscription completion service error:', error);
      throw error;
    }
  },

  // Create a checkout session with trial period (legacy - for redirect flow)
  createSubscriptionWithTrial: async (courseId: string): Promise<{ 
    checkout_url?: string;
    session_id?: string;
    course_title: string; 
    amount: number;
    requires_payment_method: boolean;
    message?: string;
  }> => {
    console.log('Creating checkout session with trial for course:', courseId);
    
    try {
      const { data, error } = await supabase.functions.invoke('create-payment-intent', {
        body: { courseId }
      });
      
      if (error) {
        console.error('Checkout session creation error:', error);
        throw error;
      }
      
      console.log('Checkout session created successfully');
      return data;
    } catch (error) {
      console.error('Checkout session service error:', error);
      throw error;
    }
  },

  // Legacy method - kept for backwards compatibility  
  completeSubscription: async (paymentIntentId: string, courseId: string): Promise<{ success: boolean; message: string }> => {
    console.log('Completing subscription (legacy):', paymentIntentId);
    return paymentService.completeSubscriptionSetup(paymentIntentId);
  },

  // Create a Stripe checkout session for course purchase (legacy method)
  createCoursePayment: async (courseId: string): Promise<{ url: string }> => {
    console.log('Creating payment for course:', courseId);
    
    try {
      const { data, error } = await supabase.functions.invoke('create-course-payment', {
        body: { courseId }
      });
      
      if (error) {
        console.error('Payment creation error:', error);
        throw error;
      }
      
      console.log('Payment session created successfully');
      return data;
    } catch (error) {
      console.error('Payment service error:', error);
      throw error;
    }
  },

  // Verify payment completion
  verifyCoursePayment: async (sessionId: string): Promise<{ success: boolean; message: string }> => {
    console.log('Verifying payment for session:', sessionId);
    
    try {
      const { data, error } = await supabase.functions.invoke('verify-course-payment', {
        body: { sessionId }
      });
      
      if (error) {
        console.error('Payment verification error:', error);
        throw error;
      }
      
      console.log('Payment verification successful');
      return data;
    } catch (error) {
      console.error('Payment verification service error:', error);
      throw error;
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

  // Sync subscription status with Stripe
  syncSubscriptionStatus: async (): Promise<{ message: string }> => {
    console.log('Syncing subscription status');
    
    try {
      const { data, error } = await supabase.functions.invoke('sync-subscription-status');
      
      if (error) {
        console.error('Subscription sync error:', error);
        throw error;
      }
      
      console.log('Subscription status synced successfully');
      return data;
    } catch (error) {
      console.error('Subscription sync service error:', error);
      throw error;
    }
  },

  // Check if user has purchased a course - now includes grace period logic
  checkCoursePurchase: async (courseId: string): Promise<boolean> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    console.log('Checking course purchase for user:', user.id, 'course:', courseId);

    const { data, error } = await supabase
      .from('course_purchases')
      .select('id, status, grace_period_end, trial_end, stripe_subscription_id, stripe_session_id')
      .eq('course_id', courseId)
      .eq('user_id', user.id)
      .in('status', ['completed', 'past_due', 'trialing', 'grace_period'])
      .maybeSingle();
    
    if (error) {
      console.error('Error checking course purchase:', error);
      return false;
    }
    
    if (!data) {
      console.log('No purchase found for course');
      return false;
    }

    // Handle grace period logic
    if (data.status === 'grace_period') {
      if (data.grace_period_end) {
        const gracePeriodEnd = new Date(data.grace_period_end);
        const now = new Date();
        
        if (now > gracePeriodEnd) {
          console.log('Grace period expired, access denied');
          // Grace period expired - should be handled by cleanup function
          return false;
        } else {
          console.log('Within grace period, access allowed', { 
            gracePeriodEnd: gracePeriodEnd.toISOString(),
            timeRemaining: Math.ceil((gracePeriodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          });
          return true;
        }
      }
    }

    // Handle trial period
    if (data.status === 'trialing' && data.trial_end) {
      const trialEnd = new Date(data.trial_end);
      const now = new Date();
      
      if (now > trialEnd) {
        console.log('Trial period expired');
        return false;
      }
    }
    
    const hasAccess = ['completed', 'past_due', 'trialing'].includes(data.status);
    console.log('Course access check result:', { hasAccess, purchaseData: data });
    
    return hasAccess;
  },

  // Get user's purchased courses with status information
  getUserPurchases: async (): Promise<CoursePurchase[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('course_purchases')
      .select('*')
      .eq('user_id', user.id)
      .order('purchase_date', { ascending: false });
    
    if (error) {
      console.error('Error fetching user purchases:', error);
      return [];
    }
    
    return data as CoursePurchase[];
  },

  // Get subscription status for a user - now includes grace period and trial logic
  getSubscriptionStatus: async (): Promise<{
    hasActiveSubscription: boolean;
    subscriptions: CoursePurchase[];
    needsPaymentUpdate: boolean;
    gracePeriodInfo?: {
      isInGracePeriod: boolean;
      gracePeriodEnd?: string;
      daysRemaining?: number;
    };
  }> => {
    const purchases = await paymentService.getUserPurchases();
    
    const activeSubscriptions = purchases.filter(p => 
      p.status === 'completed' || p.status === 'past_due' || p.status === 'trialing' || p.status === 'grace_period'
    );
    
    const needsPaymentUpdate = purchases.some(p => p.status === 'past_due' || p.status === 'grace_period');
    
    // Check for grace period info
    const gracePeriodPurchase = purchases.find(p => p.status === 'grace_period');
    let gracePeriodInfo;
    
    if (gracePeriodPurchase?.grace_period_end) {
      const gracePeriodEnd = new Date(gracePeriodPurchase.grace_period_end);
      const now = new Date();
      const daysRemaining = Math.ceil((gracePeriodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      gracePeriodInfo = {
        isInGracePeriod: true,
        gracePeriodEnd: gracePeriodPurchase.grace_period_end,
        daysRemaining: Math.max(0, daysRemaining)
      };
    }
    
    return {
      hasActiveSubscription: activeSubscriptions.length > 0,
      subscriptions: activeSubscriptions,
      needsPaymentUpdate,
      gracePeriodInfo
    };
  },

  // Clean up expired grace periods
  cleanupExpiredGracePeriods: async (): Promise<{ message: string; updated: number }> => {
    console.log('Cleaning up expired grace periods');
    
    try {
      const { data, error } = await supabase.functions.invoke('cleanup-grace-periods');
      
      if (error) {
        console.error('Grace period cleanup error:', error);
        throw error;
      }
      
      console.log('Grace period cleanup completed');
      return data;
    } catch (error) {
      console.error('Grace period cleanup service error:', error);
      throw error;
    }
  },
};
