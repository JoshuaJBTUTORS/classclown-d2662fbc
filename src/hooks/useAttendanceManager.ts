
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';

export const useAttendanceManager = () => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSendingNotification, setIsSendingNotification] = useState(false);

  const markAttendance = async (
    lessonId: string,
    studentId: number,
    status: 'attended' | 'absent' | 'late' | 'excused',
    notes?: string
  ) => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('lesson_attendance')
        .upsert({
          lesson_id: lessonId,
          student_id: studentId,
          attendance_status: status,
          marked_at: new Date().toISOString(),
          notes: notes || null
        }, {
          onConflict: 'lesson_id,student_id'
        });

      if (error) throw error;

      toast.success(`Attendance marked as ${status}`);
      return true;
    } catch (error) {
      console.error('Error marking attendance:', error);
      toast.error('Failed to mark attendance');
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  const sendLateNotification = async (
    lessonId: string,
    studentId: number,
    lessonData: {
      title: string;
      start_time: string;
      tutor?: { first_name: string; last_name: string };
    },
    studentName: string
  ) => {
    setIsSendingNotification(true);
    try {
      const lessonDate = format(parseISO(lessonData.start_time), 'MMMM d, yyyy');
      const lessonTime = format(parseISO(lessonData.start_time), 'h:mm a');
      const tutorName = lessonData.tutor 
        ? `${lessonData.tutor.first_name} ${lessonData.tutor.last_name}`
        : 'Unknown Tutor';

      const response = await supabase.functions.invoke('send-late-notification', {
        body: {
          lessonId,
          studentId,
          lessonTitle: lessonData.title,
          lessonDate,
          lessonTime,
          studentName,
          tutorName
        }
      });

      if (response.error) throw response.error;

      // Also mark the student as late in attendance
      await markAttendance(lessonId, studentId, 'late', 'Parent notified of lateness');

      toast.success('Late notification sent to parent');
      return true;
    } catch (error) {
      console.error('Error sending late notification:', error);
      toast.error('Failed to send late notification');
      return false;
    } finally {
      setIsSendingNotification(false);
    }
  };

  const getAttendanceData = async (lessonId: string) => {
    try {
      const { data, error } = await supabase
        .from('lesson_attendance')
        .select('student_id, attendance_status, marked_at, notes')
        .eq('lesson_id', lessonId);

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching attendance data:', error);
      return [];
    }
  };

  return {
    markAttendance,
    sendLateNotification,
    getAttendanceData,
    isUpdating,
    isSendingNotification
  };
};
