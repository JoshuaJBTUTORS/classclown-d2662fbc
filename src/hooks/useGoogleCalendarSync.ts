
import { useCallback } from 'react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';
import { googleCalendarService } from '@/services/googleCalendarService';

export function useGoogleCalendarSync() {
  const { organization } = useOrganization();

  // Check if Google Calendar sync is enabled for the organization
  const isSyncEnabled = useCallback(() => {
    return !!(organization?.google_calendar_enabled && organization?.google_calendar_sync_enabled);
  }, [organization]);

  // Sync a lesson with Google Calendar (create or update)
  const syncLesson = useCallback(async (lessonId: string, operation: 'create' | 'update' | 'delete') => {
    if (!organization?.id || !isSyncEnabled()) return true;

    try {
      let success = false;

      switch (operation) {
        case 'create':
          success = await googleCalendarService.createEvent(lessonId, organization.id);
          break;
        case 'update':
          success = await googleCalendarService.updateEvent(lessonId, organization.id);
          break;
        case 'delete':
          success = await googleCalendarService.deleteEvent(lessonId, organization.id);
          break;
      }

      if (!success) {
        toast.error('Failed to sync with Google Calendar. The lesson was saved locally.');
      }

      return success;
    } catch (error) {
      console.error(`Error ${operation}ing event in Google Calendar:`, error);
      toast.error('Google Calendar sync failed. The lesson was saved locally.');
      return false;
    }
  }, [organization, isSyncEnabled]);

  return {
    isSyncEnabled,
    syncLesson,
  };
}
