
import { supabase } from '@/integrations/supabase/client';
import { CoursePurchase } from '@/types/course';

export interface PlatformSubscription {
  id: string;
  user_id: string;
  stripe_subscription_id?: string;
  stripe_customer_id?: string;
  status: string;
  trial_end?: string;
  current_period_start?: string;
  current_period_end?: string;
  created_at: string;
  updated_at: string;
  has_used_trial?: boolean;
  trial_used_date?: string;
  grace_period_start?: string;
  grace_period_end?: string;
  previous_status?: string;
}

export const paymentService = {
  // Check if user has access to courses via platform subscription or legacy course purchases
  async checkCoursePurchase(courseId: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    // First check platform subscription (new model)
    const { data: platformSub } = await supabase
      .from('platform_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['active', 'trialing'])
      .maybeSingle();

    if (platformSub) {
      console.log('Access granted via platform subscription');
      return true;
    }

    // Fallback to legacy course-specific purchases for backward compatibility
    const { data: coursePurchase } = await supabase
      .from('course_purchases')
      .select('*')
      .eq('user_id', user.id)
      .eq('course_id', courseId)
      .in('status', ['completed', 'trialing'])
      .maybeSingle();

    if (coursePurchase) {
      console.log('Access granted via legacy course purchase');
      return true;
    }

    return false;
  },

  async createPaymentIntent(): Promise<{ client_secret: string; customer_id: string; amount: number }> {
    const { data, error } = await supabase.functions.invoke('create-payment-intent', {
      body: { subscription_type: 'platform' }
    });

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },

  async completeSubscriptionSetup(setupIntentId: string) {
    const { data, error } = await supabase.functions.invoke('complete-subscription', {
      body: { setupIntentId }
    });

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },

  // Legacy method for backward compatibility
  async verifyCoursePayment(sessionId: string) {
    const { data, error } = await supabase.functions.invoke('verify-course-payment', {
      body: { sessionId }
    });

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },

  async checkTrialEligibility(): Promise<{ eligible: boolean; reason?: string }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { eligible: false, reason: 'User not authenticated' };
    }

    // Check if user has used trial for platform subscription
    const { data: platformTrialHistory } = await supabase
      .from('platform_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('has_used_trial', true);

    if (platformTrialHistory && platformTrialHistory.length > 0) {
      return { 
        eligible: false, 
        reason: 'You have already used your free trial for platform access.' 
      };
    }

    // Also check legacy course purchases for trial usage
    const { data: courseTrialHistory } = await supabase
      .from('course_purchases')
      .select('*')
      .eq('user_id', user.id)
      .eq('has_used_trial', true);

    if (courseTrialHistory && courseTrialHistory.length > 0) {
      return { 
        eligible: false, 
        reason: 'You have already used your free trial.' 
      };
    }

    return { eligible: true };
  },

  async getSubscriptionStatus() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Check platform subscription first
    const { data: platformSub } = await supabase
      .from('platform_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .maybeSingle();

    if (platformSub) {
      const gracePeriodInfo = platformSub.grace_period_start && platformSub.grace_period_end 
        ? {
            isInGracePeriod: new Date() <= new Date(platformSub.grace_period_end),
            gracePeriodEnd: platformSub.grace_period_end,
            daysRemaining: Math.max(0, Math.ceil((new Date(platformSub.grace_period_end).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
          }
        : null;

      // Convert platform subscription to CoursePurchase format for backward compatibility
      const platformAsCoursePurchase: CoursePurchase = {
        id: platformSub.id,
        course_id: 'platform-access',
        user_id: platformSub.user_id,
        status: platformSub.status,
        purchase_date: platformSub.created_at,
        amount_paid: 2855, // £28.55 in pence
        currency: 'gbp',
        stripe_subscription_id: platformSub.stripe_subscription_id,
        trial_end: platformSub.trial_end,
        grace_period_start: platformSub.grace_period_start,
        grace_period_end: platformSub.grace_period_end,
        previous_status: platformSub.previous_status,
        created_at: platformSub.created_at,
        updated_at: platformSub.updated_at
      };

      return {
        hasActiveSubscription: ['active', 'trialing'].includes(platformSub.status),
        subscriptions: [platformAsCoursePurchase],
        subscriptionType: 'platform',
        needsPaymentUpdate: ['past_due', 'incomplete'].includes(platformSub.status),
        gracePeriodInfo
      };
    }

    // Fallback to legacy course purchases
    const { data: coursePurchases } = await supabase
      .from('course_purchases')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['completed', 'trialing', 'past_due', 'grace_period']);

    const hasActiveSubscription = coursePurchases?.some(p => 
      ['completed', 'trialing'].includes(p.status)
    ) || false;

    const needsPaymentUpdate = coursePurchases?.some(p => 
      ['past_due'].includes(p.status)
    ) || false;

    // Check for grace period in course purchases
    const gracePeriodPurchase = coursePurchases?.find(p => p.status === 'grace_period');
    const gracePeriodInfo = gracePeriodPurchase && gracePeriodPurchase.grace_period_end
      ? {
          isInGracePeriod: new Date() <= new Date(gracePeriodPurchase.grace_period_end),
          gracePeriodEnd: gracePeriodPurchase.grace_period_end,
          daysRemaining: Math.max(0, Math.ceil((new Date(gracePeriodPurchase.grace_period_end).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
        }
      : null;

    return {
      hasActiveSubscription,
      subscriptions: coursePurchases || [],
      subscriptionType: 'course',
      needsPaymentUpdate,
      gracePeriodInfo
    };
  },

  async syncSubscriptionStatus() {
    const { data, error } = await supabase.functions.invoke('sync-subscription-status');
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data;
  },

  async createCustomerPortal() {
    const { data, error } = await supabase.functions.invoke('customer-portal');
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data;
  },

  async getUserPurchases(): Promise<CoursePurchase[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // For platform subscriptions, we need to return a special format
    const { data: platformSub } = await supabase
      .from('platform_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['active', 'trialing'])
      .maybeSingle();

    if (platformSub) {
      // Return a synthetic purchase record for all courses if user has platform access
      const { data: allCourses } = await supabase
        .from('courses')
        .select('id')
        .eq('status', 'published');

      return (allCourses || []).map(course => ({
        id: `platform-${course.id}`,
        course_id: course.id,
        user_id: user.id,
        status: platformSub.status,
        purchase_date: platformSub.created_at,
        amount_paid: 2855, // £28.55 in pence
        currency: 'gbp',
        stripe_subscription_id: platformSub.stripe_subscription_id,
        trial_end: platformSub.trial_end,
        grace_period_start: platformSub.grace_period_start,
        grace_period_end: platformSub.grace_period_end,
        previous_status: platformSub.previous_status,
        created_at: platformSub.created_at,
        updated_at: platformSub.updated_at
      }));
    }

    // Fallback to legacy course purchases
    const { data, error } = await supabase
      .from('course_purchases')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['completed', 'trialing']);

    if (error) {
      throw new Error(error.message);
    }

    return data || [];
  }
};
