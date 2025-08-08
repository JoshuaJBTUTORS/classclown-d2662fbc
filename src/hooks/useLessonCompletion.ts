
import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { memoryCleanup } from '@/utils/devLogger';

interface LessonCompletionData {
  [lessonId: string]: {
    isCompleted: boolean;
    attendanceCount: number;
    totalStudents: number;
    hasHomework: boolean;
  };
}

const BATCH_SIZE = 50; // Maximum lessons per batch to avoid URL length issues

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

  // Memoized helper function to process a batch of lessons
  const processBatch = useCallback(async (batchIds: string[]) => {
    const [attendanceData, homeworkData, lessonStudentData] = await Promise.all([
      supabase
        .from('lesson_attendance')
        .select('lesson_id, student_id')
        .in('lesson_id', batchIds),
      supabase
        .from('homework')
        .select('lesson_id')
        .in('lesson_id', batchIds),
      supabase
        .from('lesson_students')
        .select('lesson_id, student_id')
        .in('lesson_id', batchIds)
    ]);

    // Check for errors
    if (attendanceData.error) throw attendanceData.error;
    if (homeworkData.error) throw homeworkData.error;
    if (lessonStudentData.error) throw lessonStudentData.error;

    // Process the data for this batch
    const batchCompletionData: LessonCompletionData = {};

    batchIds.forEach(lessonId => {
      const studentCount = lessonStudentData.data?.filter(ls => ls.lesson_id === lessonId).length || 0;
      const attendanceCount = attendanceData.data?.filter(att => att.lesson_id === lessonId).length || 0;
      const hasHomework = homeworkData.data?.some(hw => hw.lesson_id === lessonId) || false;

      const isCompleted = studentCount > 0 && attendanceCount === studentCount && hasHomework;

      batchCompletionData[lessonId] = {
        isCompleted,
        attendanceCount,
        totalStudents: studentCount,
        hasHomework
      };
    });

    return batchCompletionData;
  }, []);

  useEffect(() => {
    if (!stableLessonIds || stableLessonIds.length === 0) {
      setCompletionData({});
      setIsLoading(false);
      return;
    }

    const fetchCompletionData = async () => {
      setIsLoading(true);
      try {
        // If lesson count is within batch size, process normally
        if (stableLessonIds.length <= BATCH_SIZE) {
          const batchData = await processBatch(stableLessonIds);
          // Single batch processed
          setCompletionData(batchData);
          return;
        }

        // Split into batches for large datasets
        const allCompletionData: LessonCompletionData = {};
        const batches = [];
        
        for (let i = 0; i < stableLessonIds.length; i += BATCH_SIZE) {
          batches.push(stableLessonIds.slice(i, i + BATCH_SIZE));
        }

        // Process batches sequentially to avoid overwhelming the API
        for (let i = 0; i < batches.length; i++) {
          const batch = batches[i];
          
          try {
            const batchData = await processBatch(batch);
            Object.assign(allCompletionData, batchData);
            
            // Memory cleanup for large datasets
            if (i % 10 === 0) {
              memoryCleanup.clearLargeObjects();
            }
          } catch (batchError) {
            console.warn(`Batch ${i + 1} processing failed:`, batchError);
            // Continue with other batches even if one fails
          }
        }
        setCompletionData(allCompletionData);
        
        // Memory cleanup after processing large datasets
        memoryCleanup.garbageCollectionHint();
      } catch (error) {
        console.error('Error fetching lesson completion data:', error);
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
