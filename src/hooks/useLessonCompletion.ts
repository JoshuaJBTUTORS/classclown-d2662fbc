
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface LessonCompletionData {
  [lessonId: string]: {
    isCompleted: boolean;
    attendanceCount: number;
    totalStudents: number;
    hasHomework: boolean;
  };
}

export const useLessonCompletion = (lessonIds: string[]) => {
  const [completionData, setCompletionData] = useState<LessonCompletionData>({});
  const [isLoading, setIsLoading] = useState(false);

  // Fix: Stable memoization using a simpler approach
  const stableLessonIds = useMemo(() => {
    return lessonIds.slice().sort();
  }, [lessonIds.length, lessonIds.join(',')]);

  useEffect(() => {
    if (stableLessonIds.length === 0) {
      setCompletionData({});
      return;
    }

    const fetchCompletionData = async () => {
      setIsLoading(true);
      try {
        // Fetch attendance data for all lessons
        const { data: attendanceData, error: attendanceError } = await supabase
          .from('lesson_attendance')
          .select('lesson_id, student_id')
          .in('lesson_id', stableLessonIds);

        if (attendanceError) throw attendanceError;

        // Fetch homework data for all lessons
        const { data: homeworkData, error: homeworkError } = await supabase
          .from('homework')
          .select('lesson_id')
          .in('lesson_id', stableLessonIds);

        if (homeworkError) throw homeworkError;

        // Fetch student count for each lesson
        const { data: lessonStudentData, error: lessonStudentError } = await supabase
          .from('lesson_students')
          .select('lesson_id, student_id')
          .in('lesson_id', stableLessonIds);

        if (lessonStudentError) throw lessonStudentError;

        // Process the data
        const newCompletionData: LessonCompletionData = {};

        stableLessonIds.forEach(lessonId => {
          const studentCount = lessonStudentData?.filter(ls => ls.lesson_id === lessonId).length || 0;
          const attendanceCount = attendanceData?.filter(att => att.lesson_id === lessonId).length || 0;
          const hasHomework = homeworkData?.some(hw => hw.lesson_id === lessonId) || false;

          const isCompleted = studentCount > 0 && attendanceCount === studentCount && hasHomework;

          newCompletionData[lessonId] = {
            isCompleted,
            attendanceCount,
            totalStudents: studentCount,
            hasHomework
          };
        });

        setCompletionData(newCompletionData);
      } catch (error) {
        console.error('Error fetching lesson completion data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCompletionData();
  }, [stableLessonIds]);

  return { completionData, isLoading };
};
