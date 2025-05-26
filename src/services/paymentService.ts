
import { supabase } from '@/integrations/supabase/client';
import { CoursePurchase } from '@/types/course';

export const paymentService = {
  // Create a Stripe checkout session for course purchase
  createCoursePayment: async (courseId: string): Promise<{ url: string }> => {
    const { data, error } = await supabase.functions.invoke('create-course-payment', {
      body: { courseId }
    });
    
    if (error) throw error;
    return data;
  },

  // Verify payment completion
  verifyCoursePayment: async (sessionId: string): Promise<{ success: boolean; message: string }> => {
    const { data, error } = await supabase.functions.invoke('verify-course-payment', {
      body: { sessionId }
    });
    
    if (error) throw error;
    return data;
  },

  // Check if user has purchased a course
  checkCoursePurchase: async (courseId: string): Promise<boolean> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase
      .from('course_purchases')
      .select('id')
      .eq('course_id', courseId)
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .maybeSingle();
    
    if (error) {
      console.error('Error checking course purchase:', error);
      return false;
    }
    
    return !!data;
  },

  // Get user's purchased courses
  getUserPurchases: async (): Promise<CoursePurchase[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('course_purchases')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .order('purchase_date', { ascending: false });
    
    if (error) {
      console.error('Error fetching user purchases:', error);
      return [];
    }
    
    return data as CoursePurchase[];
  },
};
