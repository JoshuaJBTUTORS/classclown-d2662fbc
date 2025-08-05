import { supabase } from '@/integrations/supabase/client';

/**
 * Service to prevent demo data from auto-populating
 * and manage demo data lifecycle
 */
export class DemoControlService {
  private static readonly DEMO_CONTROL_FLAG = 'demo_data_disabled';
  
  /**
   * Check if demo data is disabled system-wide
   */
  static async isDemoDataDisabled(): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('id')
        .eq('type', 'demo_cleanup_completed')
        .limit(1);

      if (error) {
        console.error('Error checking demo cleanup status:', error);
        return false;
      }

      return (data && data.length > 0);
    } catch (error) {
      console.error('Error checking demo data status:', error);
      return false;
    }
  }

  /**
   * Disable demo data creation system-wide
   */
  static async disableDemoData(): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          type: this.DEMO_CONTROL_FLAG,
          subject: 'Demo Data Disabled',
          email: 'system@control.com',
          status: 'completed'
        });

      if (error) {
        console.error('Error disabling demo data:', error);
        return false;
      }

      // Also remove from localStorage
      localStorage.setItem(this.DEMO_CONTROL_FLAG, 'true');
      return true;
    } catch (error) {
      console.error('Error disabling demo data:', error);
      return false;
    }
  }

  /**
   * Enable demo data creation (for testing purposes)
   */
  static async enableDemoData(): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('type', this.DEMO_CONTROL_FLAG);

      if (error) {
        console.error('Error enabling demo data:', error);
        return false;
      }

      // Also remove from localStorage
      localStorage.removeItem(this.DEMO_CONTROL_FLAG);
      return true;
    } catch (error) {
      console.error('Error enabling demo data:', error);
      return false;
    }
  }

  /**
   * Check if demo data should be blocked (local check first for performance)
   */
  static shouldBlockDemoData(): boolean {
    // Quick local check first
    return localStorage.getItem(this.DEMO_CONTROL_FLAG) === 'true';
  }

  /**
   * Initialize demo control service
   */
  static async initialize(): Promise<void> {
    try {
      const isDisabled = await this.isDemoDataDisabled();
      if (isDisabled) {
        localStorage.setItem(this.DEMO_CONTROL_FLAG, 'true');
      }
    } catch (error) {
      console.error('Error initializing demo control service:', error);
    }
  }
}

export const demoControlService = new DemoControlService();