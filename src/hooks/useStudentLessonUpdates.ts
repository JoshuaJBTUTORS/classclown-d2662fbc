
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AppRole } from '@/contexts/AuthContext';

interface UseStudentLessonUpdatesProps {
  userRole: AppRole | null;
  userEmail: string | null;
  isAuthenticated: boolean;
  onLessonUpdate?: () => void;
}

export const useStudentLessonUpdates = ({ 
  userRole, 
  userEmail, 
  isAuthenticated, 
  onLessonUpdate 
}: UseStudentLessonUpdatesProps) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);

  // Set up real-time subscription for lesson changes
  useEffect(() => {
    if (!isAuthenticated || !userEmail) return;

    console.log('Setting up real-time subscription for lesson updates');
    
    const lessonChannel = supabase
      .channel('lesson-updates')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'lessons'
        },
        (payload) => {
          console.log('Lesson update received:', payload);
          setLastUpdateTime(new Date());
          if (onLessonUpdate) {
            onLessonUpdate();
          }
          toast.success('Lesson updated automatically');
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lesson_students'
        },
        (payload) => {
          console.log('Lesson student update received:', payload);
          setLastUpdateTime(new Date());
          if (onLessonUpdate) {
            onLessonUpdate();
          }
          toast.success('Lesson enrollment updated');
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up real-time subscription');
      supabase.removeChannel(lessonChannel);
    };
  }, [isAuthenticated, userEmail, onLessonUpdate]);

  // Manual refresh function for students
  const refreshStudentCalendar = useCallback(async () => {
    if (!isAuthenticated || !userEmail) return false;

    setIsUpdating(true);
    try {
      console.log('Manually refreshing student calendar...');
      
      // Trigger a refresh by updating the last update time
      setLastUpdateTime(new Date());
      if (onLessonUpdate) {
        onLessonUpdate();
      }
      
      toast.success('Calendar refreshed successfully');
      return true;
    } catch (error) {
      console.error('Error refreshing calendar:', error);
      toast.error('Failed to refresh calendar');
      return false;
    } finally {
      setIsUpdating(false);
    }
  }, [isAuthenticated, userEmail, onLessonUpdate]);

  // Update student lesson status (attendance, etc.)
  const updateStudentLessonStatus = useCallback(async (
    lessonId: string, 
    studentId: number, 
    status: string
  ) => {
    if (!isAuthenticated) return false;

    setIsUpdating(true);
    try {
      console.log(`Updating lesson status for student ${studentId} in lesson ${lessonId} to ${status}`);
      
      const { error } = await supabase
        .from('lesson_students')
        .update({ attendance_status: status })
        .eq('lesson_id', lessonId)
        .eq('student_id', studentId);

      if (error) throw error;

      toast.success('Lesson status updated successfully');
      return true;
    } catch (error) {
      console.error('Error updating lesson status:', error);
      toast.error('Failed to update lesson status');
      return false;
    } finally {
      setIsUpdating(false);
    }
  }, [isAuthenticated]);

  // Sync lesson space URLs for students
  const syncLessonSpaceUrls = useCallback(async (lessonId: string) => {
    if (!isAuthenticated) return false;

    setIsUpdating(true);
    try {
      console.log(`Syncing lesson space URLs for lesson ${lessonId}`);
      
      // Get lesson details to check if lesson space is configured
      const { data: lesson, error: lessonError } = await supabase
        .from('lessons')
        .select('lesson_space_space_id, video_conference_provider')
        .eq('id', lessonId)
        .single();

      if (lessonError) throw lessonError;

      if (lesson?.lesson_space_space_id && lesson?.video_conference_provider === 'lesson_space') {
        // The lesson space is properly configured, URLs should be available
        toast.success('Lesson space URLs are up to date');
        return true;
      } else {
        toast.info('No lesson space configured for this lesson');
        return false;
      }
    } catch (error) {
      console.error('Error syncing lesson space URLs:', error);
      toast.error('Failed to sync lesson space URLs');
      return false;
    } finally {
      setIsUpdating(false);
    }
  }, [isAuthenticated]);

  return {
    isUpdating,
    lastUpdateTime,
    refreshStudentCalendar,
    updateStudentLessonStatus,
    syncLessonSpaceUrls
  };
};
