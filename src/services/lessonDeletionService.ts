
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export enum DeleteScope {
  THIS_LESSON_ONLY = 'this_lesson_only',
  DELETE_FROM_DATE_ONWARDS = 'delete_from_date_onwards',
  ALL_RECURRING_LESSONS = 'all_recurring_lessons'
}

export interface DeleteOptions {
  deleteScope: DeleteScope;
  lessonId: string;
  isRecurring: boolean;
  isRecurringInstance: boolean;
  parentLessonId?: string;
}

export interface DeletionSummary {
  lessonsToDelete: number;
  hasHomework: boolean;
  hasAttendance: boolean;
  hasSubmissions: boolean;
}

export const lessonDeletionService = {
  async getAffectedLessonsCount(lessonId: string, deleteScope: DeleteScope): Promise<DeletionSummary> {
    try {
      let lessonIds: string[] = [];
      
      if (deleteScope === DeleteScope.THIS_LESSON_ONLY) {
        lessonIds = [lessonId];
      } else if (deleteScope === DeleteScope.DELETE_FROM_DATE_ONWARDS) {
        // Get the current lesson's start time and recurring info
        const { data: currentLesson } = await supabase
          .from('lessons')
          .select('start_time, parent_lesson_id, is_recurring')
          .eq('id', lessonId)
          .single();

        if (!currentLesson) throw new Error('Lesson not found');

        const currentStartTime = currentLesson.start_time;
        let parentLessonId = currentLesson.is_recurring ? lessonId : currentLesson.parent_lesson_id;

        if (parentLessonId) {
          // Get all instances from this date onwards
          const { data: instances } = await supabase
            .from('lessons')
            .select('id')
            .or(`id.eq.${parentLessonId},parent_lesson_id.eq.${parentLessonId}`)
            .gte('start_time', currentStartTime);
          
          lessonIds = instances?.map(l => l.id) || [];
        } else {
          // Single lesson, just include this one
          lessonIds = [lessonId];
        }
      } else {
        // Get all instances of the recurring lesson (existing logic)
        const { data: lesson } = await supabase
          .from('lessons')
          .select('parent_lesson_id, is_recurring')
          .eq('id', lessonId)
          .single();

        if (lesson?.is_recurring) {
          // If this is the parent lesson, get all instances
          const { data: instances } = await supabase
            .from('lessons')
            .select('id')
            .or(`id.eq.${lessonId},parent_lesson_id.eq.${lessonId}`);
          
          lessonIds = instances?.map(l => l.id) || [];
        } else if (lesson?.parent_lesson_id) {
          // If this is an instance, get all instances including parent
          const { data: instances } = await supabase
            .from('lessons')
            .select('id')
            .or(`id.eq.${lesson.parent_lesson_id},parent_lesson_id.eq.${lesson.parent_lesson_id}`);
          
          lessonIds = instances?.map(l => l.id) || [];
        }
      }

      // Check for homework
      const { data: homework } = await supabase
        .from('homework')
        .select('id')
        .in('lesson_id', lessonIds);

      // Check for attendance
      const { data: attendance } = await supabase
        .from('lesson_attendance')
        .select('id')
        .in('lesson_id', lessonIds);

      // Check for homework submissions
      const { data: submissions } = await supabase
        .from('homework_submissions')
        .select('id')
        .in('homework_id', homework?.map(h => h.id) || []);

      return {
        lessonsToDelete: lessonIds.length,
        hasHomework: (homework?.length || 0) > 0,
        hasAttendance: (attendance?.length || 0) > 0,
        hasSubmissions: (submissions?.length || 0) > 0
      };
    } catch (error) {
      console.error('Error getting affected lessons count:', error);
      throw error;
    }
  },

  async deleteSingleLesson(lessonId: string): Promise<void> {
    try {
      // First, delete related data
      await this.cleanupRelatedData([lessonId]);
      
      // Delete the lesson
      const { error } = await supabase
        .from('lessons')
        .delete()
        .eq('id', lessonId);

      if (error) throw error;

      // Call Google Calendar sync if needed
      await this.syncGoogleCalendarDeletion(lessonId);
      
      toast.success('Lesson deleted successfully');
    } catch (error) {
      console.error('Error deleting lesson:', error);
      toast.error('Failed to delete lesson');
      throw error;
    }
  },

  async deleteRecurringInstance(lessonId: string): Promise<void> {
    try {
      // Just delete this single instance
      await this.deleteSingleLesson(lessonId);
    } catch (error) {
      console.error('Error deleting recurring instance:', error);
      throw error;
    }
  },

  async deleteFromDateOnwards(lessonId: string): Promise<void> {
    try {
      // Get the current lesson's start time and recurring info
      const { data: currentLesson } = await supabase
        .from('lessons')
        .select('start_time, parent_lesson_id, is_recurring')
        .eq('id', lessonId)
        .single();

      if (!currentLesson) throw new Error('Lesson not found');

      const currentStartTime = currentLesson.start_time;
      let parentLessonId = currentLesson.is_recurring ? lessonId : currentLesson.parent_lesson_id;

      if (!parentLessonId) {
        // This is a single lesson, just delete it
        await this.deleteSingleLesson(lessonId);
        return;
      }

      // Get all instances from this date onwards
      const { data: instances } = await supabase
        .from('lessons')
        .select('id')
        .or(`id.eq.${parentLessonId},parent_lesson_id.eq.${parentLessonId}`)
        .gte('start_time', currentStartTime);

      const lessonIds = instances?.map(l => l.id) || [];

      if (lessonIds.length === 0) return;

      // Clean up all related data
      await this.cleanupRelatedData(lessonIds);

      // Delete lessons from this date onwards
      const { error } = await supabase
        .from('lessons')
        .delete()
        .in('id', lessonIds);

      if (error) throw error;

      // Sync Google Calendar deletions
      for (const id of lessonIds) {
        await this.syncGoogleCalendarDeletion(id);
      }

      toast.success(`Deleted ${lessonIds.length} lessons from this date onwards`);
    } catch (error) {
      console.error('Error deleting lessons from date onwards:', error);
      toast.error('Failed to delete lessons from date onwards');
      throw error;
    }
  },

  async deleteAllRecurringLessons(lessonId: string): Promise<void> {
    try {
      // Get the lesson to determine if it's parent or instance
      const { data: lesson } = await supabase
        .from('lessons')
        .select('parent_lesson_id, is_recurring')
        .eq('id', lessonId)
        .single();

      if (!lesson) throw new Error('Lesson not found');

      let parentLessonId = lesson.is_recurring ? lessonId : lesson.parent_lesson_id;
      
      if (!parentLessonId) {
        // This is a single lesson, just delete it
        await this.deleteSingleLesson(lessonId);
        return;
      }

      // Get all instances of the recurring lesson
      const { data: instances } = await supabase
        .from('lessons')
        .select('id')
        .or(`id.eq.${parentLessonId},parent_lesson_id.eq.${parentLessonId}`);

      const lessonIds = instances?.map(l => l.id) || [];

      if (lessonIds.length === 0) return;

      // Clean up all related data
      await this.cleanupRelatedData(lessonIds);

      // Delete all lessons
      const { error } = await supabase
        .from('lessons')
        .delete()
        .in('id', lessonIds);

      if (error) throw error;

      // Clean up recurring lesson group
      await supabase
        .from('recurring_lesson_groups')
        .delete()
        .eq('original_lesson_id', parentLessonId);

      // Sync Google Calendar deletions
      for (const id of lessonIds) {
        await this.syncGoogleCalendarDeletion(id);
      }

      toast.success(`Deleted ${lessonIds.length} lessons from recurring series`);
    } catch (error) {
      console.error('Error deleting recurring lessons:', error);
      toast.error('Failed to delete recurring lessons');
      throw error;
    }
  },

  async cleanupRelatedData(lessonIds: string[]): Promise<void> {
    try {
      // Get homework IDs for these lessons
      const { data: homework } = await supabase
        .from('homework')
        .select('id')
        .in('lesson_id', lessonIds);

      const homeworkIds = homework?.map(h => h.id) || [];

      // Delete homework submissions
      if (homeworkIds.length > 0) {
        await supabase
          .from('homework_submissions')
          .delete()
          .in('homework_id', homeworkIds);
      }

      // Delete homework
      await supabase
        .from('homework')
        .delete()
        .in('lesson_id', lessonIds);

      // Delete lesson attendance
      await supabase
        .from('lesson_attendance')
        .delete()
        .in('lesson_id', lessonIds);

      // Delete lesson-student associations
      await supabase
        .from('lesson_students')
        .delete()
        .in('lesson_id', lessonIds);

      // Handle trial bookings - set lesson_id to null to preserve booking history
      console.log('Cleaning up trial bookings for lessons:', lessonIds);
      const { error: trialBookingError } = await supabase
        .from('trial_bookings')
        .update({ lesson_id: null })
        .in('lesson_id', lessonIds);

      if (trialBookingError) {
        console.error('Error updating trial bookings:', trialBookingError);
        throw trialBookingError;
      }

    } catch (error) {
      console.error('Error cleaning up related data:', error);
      throw error;
    }
  },

  async syncGoogleCalendarDeletion(lessonId: string): Promise<void> {
    try {
      // This would call the Google Calendar sync function to delete the event
      // For now, we'll just log it as the Google Calendar integration may not be fully set up
      console.log('Would sync Google Calendar deletion for lesson:', lessonId);
    } catch (error) {
      console.error('Error syncing Google Calendar deletion:', error);
      // Don't throw here as this is not critical for the lesson deletion
    }
  }
};
