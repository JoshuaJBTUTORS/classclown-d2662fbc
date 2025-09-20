
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

const BATCH_SIZE = 50; // Process 50 lessons at a time to avoid URL length limits

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
    return validIds.slice().sort();
  }, [lessonIds?.length, lessonIds?.filter(id => id != null && id !== '').sort().join('|')]);

  // Helper function to process data in batches
  const processBatches = async <T>(
    ids: string[],
    batchProcessor: (batch: string[]) => Promise<T[]>,
    operationName: string
  ): Promise<T[]> => {
    const batches = [];
    for (let i = 0; i < ids.length; i += BATCH_SIZE) {
      batches.push(ids.slice(i, i + BATCH_SIZE));
    }

    const allResults: T[] = [];
    
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      
      try {
        const batchResults = await batchProcessor(batch);
        allResults.push(...batchResults);
      } catch (error) {
        console.error(`❌ ${operationName}: Batch ${i + 1} failed:`, error);
        // Continue with other batches even if one fails
      }
    }

    return allResults;
  };

  useEffect(() => {
    if (!stableLessonIds || stableLessonIds.length === 0) {
      setCompletionData({});
      setIsLoading(false);
      return;
    }

    const fetchCompletionData = async () => {
      setIsLoading(true);
      
      try {
        // Fetch attendance data in batches
        const attendanceData = await processBatches(
          stableLessonIds,
          async (batch: string[]) => {
            const { data, error } = await supabase
              .from('lesson_attendance')
              .select('lesson_id, student_id')
              .in('lesson_id', batch);
            
            if (error) throw error;
            return data || [];
          },
          'Attendance Data Fetch'
        );

        // Fetch homework data in batches
        const homeworkData = await processBatches(
          stableLessonIds,
          async (batch: string[]) => {
            const { data, error } = await supabase
              .from('homework')
              .select('lesson_id')
              .in('lesson_id', batch);
            
            if (error) throw error;
            return data || [];
          },
          'Homework Data Fetch'
        );

        // Fetch lesson student data in batches
        const lessonStudentData = await processBatches(
          stableLessonIds,
          async (batch: string[]) => {
            const { data, error } = await supabase
              .from('lesson_students')
              .select('lesson_id, student_id')
              .in('lesson_id', batch);
            
            if (error) throw error;
            return data || [];
          },
          'Lesson Student Data Fetch'
        );

        // Process the combined data
        const newCompletionData: LessonCompletionData = {};
        let completedLessons = 0;

        stableLessonIds.forEach(lessonId => {
          const studentCount = lessonStudentData.filter(ls => ls.lesson_id === lessonId).length;
          const attendanceCount = attendanceData.filter(att => att.lesson_id === lessonId).length;
          const hasHomework = homeworkData.some(hw => hw.lesson_id === lessonId);

          const isCompleted = studentCount > 0 && attendanceCount === studentCount && hasHomework;
          
          if (isCompleted) completedLessons++;

          newCompletionData[lessonId] = {
            isCompleted,
            attendanceCount,
            totalStudents: studentCount,
            hasHomework
          };
        });
        
        setCompletionData(newCompletionData);
      } catch (error) {
        console.error('❌ Error fetching lesson completion data:', error);
        // Set empty data on error to prevent infinite loops
        setCompletionData({});
      } finally {
        setIsLoading(false);
      }
    };

    fetchCompletionData();
  }, [stableLessonIds.join('|')]); // Use pipe separator for more stability

  return { completionData, isLoading };
};
