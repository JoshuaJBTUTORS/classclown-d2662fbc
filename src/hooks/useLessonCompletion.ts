
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

  // Fixed: Stable memoization using length and sorted string
  const stableLessonIds = useMemo(() => {
    if (!lessonIds || lessonIds.length === 0) {
      return [];
    }
    // Filter out null/undefined values and sort for stable comparison
    const validIds = lessonIds.filter(id => id != null && id !== '');
    console.log(`🔧 useLessonCompletion: Processing ${validIds.length} lesson IDs`);
    return validIds.slice().sort();
  }, [lessonIds?.length, lessonIds?.filter(id => id != null && id !== '').sort().join('|')]);

  useEffect(() => {
    if (!stableLessonIds || stableLessonIds.length === 0) {
      console.log('⚠️ useLessonCompletion: No lesson IDs to process, resetting completion data');
      setCompletionData({});
      setIsLoading(false);
      return;
    }

    const fetchCompletionData = async () => {
      console.log(`🚀 useLessonCompletion: Starting completion data fetch for ${stableLessonIds.length} lessons`);
      setIsLoading(true);
      try {
        // Fetch attendance data for all lessons (RLS will filter automatically)
        console.log('📋 Fetching attendance data...');
        const { data: attendanceData, error: attendanceError } = await supabase
          .from('lesson_attendance')
          .select('lesson_id, student_id')
          .in('lesson_id', stableLessonIds);

        if (attendanceError) throw attendanceError;
        console.log(`✅ Attendance data fetched: ${attendanceData?.length || 0} records`);

        // Fetch homework data for all lessons (RLS will filter automatically)
        console.log('📝 Fetching homework data...');
        const { data: homeworkData, error: homeworkError } = await supabase
          .from('homework')
          .select('lesson_id')
          .in('lesson_id', stableLessonIds);

        if (homeworkError) throw homeworkError;
        console.log(`✅ Homework data fetched: ${homeworkData?.length || 0} records`);

        // Fetch student count for each lesson (RLS will filter automatically)
        console.log('👥 Fetching lesson student data...');
        const { data: lessonStudentData, error: lessonStudentError } = await supabase
          .from('lesson_students')
          .select('lesson_id, student_id')
          .in('lesson_id', stableLessonIds);

        if (lessonStudentError) throw lessonStudentError;
        console.log(`✅ Lesson student data fetched: ${lessonStudentData?.length || 0} records`);

        // Process the data
        const newCompletionData: LessonCompletionData = {};
        let completedLessons = 0;

        console.log('🔄 Processing completion data for each lesson...');
        stableLessonIds.forEach(lessonId => {
          const studentCount = lessonStudentData?.filter(ls => ls.lesson_id === lessonId).length || 0;
          const attendanceCount = attendanceData?.filter(att => att.lesson_id === lessonId).length || 0;
          const hasHomework = homeworkData?.some(hw => hw.lesson_id === lessonId) || false;

          const isCompleted = studentCount > 0 && attendanceCount === studentCount && hasHomework;
          
          if (isCompleted) completedLessons++;

          newCompletionData[lessonId] = {
            isCompleted,
            attendanceCount,
            totalStudents: studentCount,
            hasHomework
          };
        });

        console.log(`📊 Completion processing complete:`);
        console.log(`   • Total lessons processed: ${stableLessonIds.length}`);
        console.log(`   • Lessons with students: ${Object.values(newCompletionData).filter(d => d.totalStudents > 0).length}`);
        console.log(`   • Lessons with homework: ${Object.values(newCompletionData).filter(d => d.hasHomework).length}`);
        console.log(`   • Completed lessons: ${completedLessons}`);
        
        setCompletionData(newCompletionData);
      } catch (error) {
        console.error('❌ Error fetching lesson completion data:', error);
        // Set empty data on error to prevent infinite loops
        setCompletionData({});
      } finally {
        setIsLoading(false);
        console.log('✅ useLessonCompletion: Fetch process completed');
      }
    };

    fetchCompletionData();
  }, [stableLessonIds.join('|')]); // Use pipe separator for more stability

  return { completionData, isLoading };
};
