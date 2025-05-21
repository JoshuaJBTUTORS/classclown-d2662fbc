
import { supabase } from '@/integrations/supabase/client';
import { Lesson } from '@/types/lesson';

export const googleCalendarService = {
  async createEvent(lessonId: string, organizationId: string): Promise<boolean> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      const { data, error } = await supabase.functions.invoke('google-calendar-sync', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${userData.session?.access_token}`
        },
        body: {
          operation: 'create',
          lessonId,
          organizationId
        }
      });
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error creating Google Calendar event:', error);
      return false;
    }
  },
  
  async updateEvent(lessonId: string, organizationId: string): Promise<boolean> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      const { data, error } = await supabase.functions.invoke('google-calendar-sync', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${userData.session?.access_token}`
        },
        body: {
          operation: 'update',
          lessonId,
          organizationId
        }
      });
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating Google Calendar event:', error);
      return false;
    }
  },
  
  async deleteEvent(lessonId: string, organizationId: string): Promise<boolean> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      const { data, error } = await supabase.functions.invoke('google-calendar-sync', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${userData.session?.access_token}`
        },
        body: {
          operation: 'delete',
          lessonId,
          organizationId
        }
      });
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting Google Calendar event:', error);
      return false;
    }
  }
};
