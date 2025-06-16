
import { supabase } from '@/integrations/supabase/client';
import { CoursePurchase } from '@/types/course';

export const paymentService = {
  // Create a Payment Intent for embedded checkout
  createPaymentIntent: async (courseId: string): Promise<{ 
    client_secret: string; 
    customer_id: string; 
    course_title: string; 
    amount: number; 
  }> => {
    console.log('Creating payment intent for course:', courseId);
    
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

  // Complete subscription after successful payment
  completeSubscription: async (paymentIntentId: string, courseId: string): Promise<{ success: boolean; message: string }> => {
    console.log('Completing subscription for payment intent:', paymentIntentId);
    
    try {
      const { data, error } = await supabase.functions.invoke('complete-subscription', {
        body: { paymentIntentId, courseId }
      });
      
      if (error) {
        console.error('Subscription completion error:', error);
        throw error;
      }
      
      console.log('Subscription completed successfully');
      return data;
    } catch (error) {
      console.error('Subscription completion service error:', error);
      throw error;
    }
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

  // Check if user has purchased a course with enhanced status checking
  checkCoursePurchase: async (courseId: string): Promise<boolean> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase
      .from('course_purchases')
      .select('id, status')
      .eq('course_id', courseId)
      .eq('user_id', user.id)
      .in('status', ['completed', 'past_due']) // Allow access for past_due to give grace period
      .maybeSingle();
    
    if (error) {
      console.error('Error checking course purchase:', error);
      return false;
    }
    
    return !!data;
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

  // Get subscription status for a user
  getSubscriptionStatus: async (): Promise<{
    hasActiveSubscription: boolean;
    subscriptions: CoursePurchase[];
    needsPaymentUpdate: boolean;
  }> => {
    const purchases = await paymentService.getUserPurchases();
    
    const activeSubscriptions = purchases.filter(p => 
      p.status === 'completed' || p.status === 'past_due'
    );
    
    const needsPaymentUpdate = purchases.some(p => p.status === 'past_due');
    
    return {
      hasActiveSubscription: activeSubscriptions.length > 0,
      subscriptions: activeSubscriptions,
      needsPaymentUpdate
    };
  },
};
