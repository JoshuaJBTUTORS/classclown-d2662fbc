import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const HEYCLEO_URL = 'https://heycleo.io';

export const heyCleoRedirectService = {
  /**
   * Generate a signed token and redirect user to HeyCleo
   */
  async redirectToHeyCleo(): Promise<void> {
    try {
      // Call edge function to generate signed token
      const { data, error } = await supabase.functions.invoke('generate-heycleo-token', {
        body: {}
      });

      if (error) {
        console.error('Error generating HeyCleo token:', error);
        toast.error('Failed to connect to HeyCleo');
        return;
      }

      if (!data?.token || !data?.email) {
        console.error('Invalid token response from edge function');
        toast.error('Failed to generate access token');
        return;
      }

      // Construct redirect URL with token and email
      const redirectUrl = `${HEYCLEO_URL}/auto-login?token=${encodeURIComponent(data.token)}&email=${encodeURIComponent(data.email)}`;
      
      console.log('Redirecting to HeyCleo...');
      
      // Redirect to HeyCleo
      window.location.href = redirectUrl;

    } catch (error) {
      console.error('Error redirecting to HeyCleo:', error);
      toast.error('Failed to connect to HeyCleo');
    }
  }
};
