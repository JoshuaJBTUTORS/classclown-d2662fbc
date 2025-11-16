
import { supabase } from '@/integrations/supabase/client';
import { CoursePurchase } from '@/types/course';

export const paymentService = {
  // Check if user is eligible for a free trial
  checkTrialEligibility: async (): Promise<{ eligible: boolean; reason?: string }> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { eligible: false, reason: "User not authenticated" };
    }

    console.log('Checking trial eligibility for user:', user.email);

    const { data: trialHistory, error } = await supabase
      .from('course_purchases')
      .select('*')
      .eq('user_id', user.id)
      .eq('has_used_trial', true);

    if (error) {
      console.error('Error checking trial eligibility:', error);
      return { eligible: false, reason: "Error checking trial status" };
    }

    console.log('Trial history found:', trialHistory?.length || 0, 'purchases');

    if (trialHistory && trialHistory.length > 0) {
      console.log('TRIAL INELIGIBLE: User has already used trial');
      return { 
        eligible: false, 
        reason: "You have already used your free trial. Please choose a paid subscription." 
      };
    }

    console.log('TRIAL ELIGIBLE: User can use free trial');
    return { eligible: true };
  },

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

    // Check if course is free for all users
    const { data: courseData } = await supabase
      .from('courses')
      .select('is_free_for_all')
      .eq('id', courseId)
      .single();

    if (courseData?.is_free_for_all) {
      console.log('Course is free for all users, granting access');
      return true;
    }

    // Check if user is owner first
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    if (roles?.some(r => r.role === 'owner')) {
      console.log('User is owner, granting access');
      return true;
    }

    // Check if user is a parent with complimentary access
    const { data: parentData } = await supabase
      .from('parents')
      .select('has_complimentary_access')
      .eq('user_id', user.id)
      .single();

    if (parentData?.has_complimentary_access) {
      console.log('Parent has complimentary access, granting access');
      return true;
    }

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

  // Check if user has platform subscription access
  checkPlatformSubscriptionAccess: async (): Promise<{
    hasAccess: boolean;
    subscription?: any;
    reason?: string;
  }> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { hasAccess: false, reason: 'Not authenticated' };

    console.log('Checking platform subscription access for user:', user.id);

    // Check if user is owner
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    if (roles?.some(r => r.role === 'owner')) {
      console.log('User is owner, granting access');
      return { hasAccess: true, reason: 'Owner access' };
    }

    // Check if user has Cleo Hub access granted manually
    const { data: profile } = await supabase
      .from('profiles')
      .select('has_cleo_hub_access')
      .eq('id', user.id)
      .single();

    if (profile?.has_cleo_hub_access) {
      console.log('User has manual Cleo Hub access granted');
      return { hasAccess: true, reason: 'Cleo Hub access granted' };
    }

    // Check for active platform subscription
    const { data: subscription } = await supabase
      .from('user_platform_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['active', 'trialing'])
      .maybeSingle();

    if (subscription) {
      console.log('User has active platform subscription:', subscription.status);
      return { hasAccess: true, subscription };
    }

    // Check for available voice session quotas (including free sessions)
    const now = new Date().toISOString();
    const { data: quota } = await supabase
      .from('voice_session_quotas')
      .select('sessions_remaining, bonus_sessions')
      .eq('user_id', user.id)
      .lte('period_start', now)
      .gte('period_end', now)
      .maybeSingle();

    if (quota) {
      const totalRemaining = (quota.sessions_remaining || 0) + (quota.bonus_sessions || 0);
      if (totalRemaining > 0) {
        console.log('User has available free sessions:', totalRemaining);
        return { 
          hasAccess: true, 
          reason: `${totalRemaining} free session${totalRemaining > 1 ? 's' : ''} available` 
        };
      }
    }

    console.log('No active platform subscription or free sessions found');
    return { hasAccess: false, reason: 'No active subscription or free sessions' };
  },
};
