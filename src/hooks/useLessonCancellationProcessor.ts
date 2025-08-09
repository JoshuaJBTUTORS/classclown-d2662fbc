
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useLessonCancellationProcessor = () => {
  const [isProcessing, setIsProcessing] = useState(false);

  const checkAndProcessCancellation = async (lessonId: string) => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    try {
      // Get all attendance records for this lesson
      const { data: attendanceRecords, error: attendanceError } = await supabase
        .from('lesson_attendance')
        .select('student_id, attendance_status')
        .eq('lesson_id', lessonId);

      if (attendanceError) {
        console.error('Error fetching attendance records:', attendanceError);
        return;
      }

      // Get all students for this lesson
      const { data: lessonStudents, error: studentsError } = await supabase
        .from('lesson_students')
        .select('student_id')
        .eq('lesson_id', lessonId);

      if (studentsError) {
        console.error('Error fetching lesson students:', studentsError);
        return;
      }

      // Check if all students are marked as excused
      if (lessonStudents && lessonStudents.length > 0) {
        const excusedStudents = attendanceRecords?.filter(record => 
          record.attendance_status === 'excused'
        ) || [];

        console.log(`Lesson ${lessonId}: ${excusedStudents.length} excused out of ${lessonStudents.length} total students`);

        // If all students are excused, cancel the lesson
        if (excusedStudents.length === lessonStudents.length) {
          await cancelLesson(lessonId);
          toast.info('Lesson automatically cancelled - all students excused');
        }
      }
    } catch (error) {
      console.error('Error processing lesson cancellation:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const cancelLesson = async (lessonId: string) => {
    try {
      // Get current lesson data to increment cancelled_count
      const { data: currentLesson, error: fetchError } = await supabase
        .from('lessons')
        .select('cancelled_count')
        .eq('id', lessonId)
        .single();

      if (fetchError) throw fetchError;

      // Update lesson status to cancelled
      const { error: updateError } = await supabase
        .from('lessons')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancelled_count: (currentLesson?.cancelled_count || 0) + 1
        })
        .eq('id', lessonId);

      if (updateError) throw updateError;

      console.log(`Lesson ${lessonId} cancelled - all students excused`);
    } catch (error) {
      console.error('Error cancelling lesson:', error);
      throw error;
    }
  };

  return {
    checkAndProcessCancellation,
    isProcessing
  };
};
