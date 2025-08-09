
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useLessonCancellationProcessor = () => {
  const checkAndProcessCancellation = useCallback(async (lessonId: string) => {
    try {
      console.log(`🔍 Checking cancellation status for lesson ${lessonId}`);

      // Get all students enrolled in the lesson
      const { data: lessonStudents, error: studentsError } = await supabase
        .from('lesson_students')
        .select('student_id')
        .eq('lesson_id', lessonId);

      if (studentsError) throw studentsError;

      if (!lessonStudents || lessonStudents.length === 0) {
        console.log(`ℹ️ No students found for lesson ${lessonId}`);
        return false;
      }

      const totalStudents = lessonStudents.length;
      console.log(`👥 Total students in lesson: ${totalStudents}`);

      // Get attendance records for all students in this lesson
      const { data: attendanceRecords, error: attendanceError } = await supabase
        .from('lesson_attendance')
        .select('student_id, attendance_status')
        .eq('lesson_id', lessonId)
        .in('student_id', lessonStudents.map(ls => ls.student_id));

      if (attendanceError) throw attendanceError;

      // Check if all enrolled students have attendance marked
      const markedAttendance = attendanceRecords || [];
      console.log(`📊 Attendance records found: ${markedAttendance.length}`);

      // Only proceed if all students have attendance marked
      if (markedAttendance.length !== totalStudents) {
        console.log(`⏳ Not all students have attendance marked yet (${markedAttendance.length}/${totalStudents})`);
        return false;
      }

      // Check if ALL students are marked as absent
      const absentStudents = markedAttendance.filter(record => 
        record.attendance_status === 'absent'
      );

      console.log(`❌ Students marked absent: ${absentStudents.length}/${totalStudents}`);

      // If all students are absent, mark lesson as cancelled
      if (absentStudents.length === totalStudents && totalStudents > 0) {
        console.log(`🚫 All students absent - cancelling lesson ${lessonId}`);

        // Get current lesson data to increment cancellation count
        const { data: currentLesson, error: lessonError } = await supabase
          .from('lessons')
          .select('cancelled_count, status')
          .eq('id', lessonId)
          .single();

        if (lessonError) throw lessonError;

        // Update lesson to cancelled status
        const { error: updateError } = await supabase
          .from('lessons')
          .update({
            status: 'cancelled',
            cancelled_at: new Date().toISOString(),
            cancelled_count: (currentLesson.cancelled_count || 0) + 1
          })
          .eq('id', lessonId);

        if (updateError) throw updateError;

        toast.success('Lesson automatically cancelled - all students marked absent');
        console.log(`✅ Lesson ${lessonId} successfully cancelled`);
        return true;
      }

      console.log(`✅ Lesson ${lessonId} has attending students - not cancelled`);
      return false;

    } catch (error) {
      console.error('❌ Error processing lesson cancellation:', error);
      toast.error('Failed to process lesson cancellation');
      return false;
    }
  }, []);

  return { checkAndProcessCancellation };
};
