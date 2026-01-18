import { supabase } from '@/integrations/supabase/client';

export interface GoogleCalendarEventResult {
  success: boolean;
  meetLink?: string;
  eventId?: string;
  error?: string;
  skipped?: boolean;
}

/**
 * Create a Google Calendar event with Meet link for a lesson
 */
export const createGoogleMeetForLesson = async (lessonId: string): Promise<GoogleCalendarEventResult> => {
  try {
    console.log(`Creating Google Meet for lesson: ${lessonId}`);
    
    const { data, error } = await supabase.functions.invoke('google-calendar-create-event', {
      body: { lessonId }
    });

    if (error) {
      console.error('Error creating Google Meet:', error);
      return { success: false, error: error.message };
    }

    if (!data?.success) {
      console.error('Google Meet creation failed:', data?.error);
      return { success: false, error: data?.error || 'Unknown error' };
    }

    console.log(`✅ Google Meet created for lesson ${lessonId}: ${data.meetLink}`);
    return {
      success: true,
      meetLink: data.meetLink,
      eventId: data.eventId,
      skipped: data.skipped
    };
  } catch (error: any) {
    console.error('Exception creating Google Meet:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Create Google Meet events for multiple lessons (batch)
 */
export const createGoogleMeetForLessons = async (
  lessonIds: string[]
): Promise<{ success: number; failed: number; results: GoogleCalendarEventResult[] }> => {
  console.log(`Creating Google Meet events for ${lessonIds.length} lessons`);
  
  const results: GoogleCalendarEventResult[] = [];
  let successCount = 0;
  let failedCount = 0;

  for (const lessonId of lessonIds) {
    const result = await createGoogleMeetForLesson(lessonId);
    results.push(result);
    
    if (result.success) {
      successCount++;
    } else {
      failedCount++;
    }
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(`Batch complete: ${successCount} success, ${failedCount} failed`);
  return { success: successCount, failed: failedCount, results };
};

/**
 * Sync a Google Calendar event for a lesson (update attendees, time, etc.)
 * This is used when lesson details change (tutor change, time change, student change)
 */
export const syncGoogleCalendarEvent = async (
  lessonId: string,
  operation: 'create' | 'update' | 'delete'
): Promise<GoogleCalendarEventResult> => {
  try {
    console.log(`Syncing Google Calendar event for lesson ${lessonId}: ${operation}`);
    
    if (operation === 'create') {
      return await createGoogleMeetForLesson(lessonId);
    }
    
    if (operation === 'delete') {
      // For now, we don't delete the calendar event when a lesson is cancelled
      // The Meet link remains valid but the event is orphaned
      // Future: implement actual deletion
      console.log(`Delete operation not implemented for lesson ${lessonId}`);
      return { success: true };
    }
    
    // For 'update' - we recreate the event since updating attendees/time is complex
    // First, we could delete the old event and create a new one
    // For now, we just create a new event if one doesn't exist
    const { data: lesson } = await supabase
      .from('lessons')
      .select('google_event_id, video_conference_link')
      .eq('id', lessonId)
      .single();
    
    if (!lesson?.google_event_id || !lesson?.video_conference_link) {
      // No existing event, create one
      return await createGoogleMeetForLesson(lessonId);
    }
    
    // Event exists - for now we keep the existing link
    // Future: implement proper update logic with Google Calendar API
    console.log(`Lesson ${lessonId} already has Meet link, keeping existing`);
    return {
      success: true,
      meetLink: lesson.video_conference_link,
      eventId: lesson.google_event_id,
      skipped: true
    };
  } catch (error: any) {
    console.error('Exception syncing Google Calendar event:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Check if a lesson has a valid Google Meet link
 */
export const hasGoogleMeetLink = async (lessonId: string): Promise<boolean> => {
  try {
    const { data } = await supabase
      .from('lessons')
      .select('video_conference_link, video_conference_provider')
      .eq('id', lessonId)
      .single();
    
    return !!(data?.video_conference_link && data?.video_conference_provider === 'google_meet');
  } catch {
    return false;
  }
};
