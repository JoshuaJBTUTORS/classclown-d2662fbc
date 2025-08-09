
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AttendanceStatusData {
  [lessonId: string]: {
    isCancelled: boolean; // all students excused
    isAbsent: boolean; // all students absent
    totalStudents: number;
    attendanceCount: number;
  };
}

const BATCH_SIZE = 50;

export const useAttendanceStatus = (lessonIds: string[]) => {
  const [attendanceStatusData, setAttendanceStatusData] = useState<AttendanceStatusData>({});
  const [isLoading, setIsLoading] = useState(false);

  const stableLessonIds = useMemo(() => {
    if (!lessonIds || lessonIds.length === 0) {
      return [];
    }
    const validIds = lessonIds.filter(id => id != null && id !== '');
    console.log(`🔧 useAttendanceStatus: Processing ${validIds.length} lesson IDs`);
    return validIds.slice().sort();
  }, [lessonIds?.length, lessonIds?.filter(id => id != null && id !== '').sort().join('|')]);

  const processBatches = async <T>(
    ids: string[],
    batchProcessor: (batch: string[]) => Promise<T[]>,
    operationName: string
  ): Promise<T[]> => {
    const batches = [];
    for (let i = 0; i < ids.length; i += BATCH_SIZE) {
      batches.push(ids.slice(i, i + BATCH_SIZE));
    }

    console.log(`📦 ${operationName}: Processing ${ids.length} items in ${batches.length} batches`);

    const allResults: T[] = [];
    
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      console.log(`🔄 ${operationName}: Processing batch ${i + 1}/${batches.length}`);
      
      try {
        const batchResults = await batchProcessor(batch);
        allResults.push(...batchResults);
      } catch (error) {
        console.error(`❌ ${operationName}: Batch ${i + 1} failed:`, error);
      }
    }

    return allResults;
  };

  useEffect(() => {
    if (!stableLessonIds || stableLessonIds.length === 0) {
      console.log('⚠️ useAttendanceStatus: No lesson IDs to process');
      setAttendanceStatusData({});
      setIsLoading(false);
      return;
    }

    const fetchAttendanceStatus = async () => {
      console.log(`🚀 useAttendanceStatus: Starting batch attendance status fetch for ${stableLessonIds.length} lessons`);
      setIsLoading(true);
      
      try {
        // Fetch attendance data in batches
        const attendanceData = await processBatches(
          stableLessonIds,
          async (batch: string[]) => {
            const { data, error } = await supabase
              .from('lesson_attendance')
              .select('lesson_id, student_id, attendance_status')
              .in('lesson_id', batch);
            
            if (error) throw error;
            return data || [];
          },
          'Attendance Status Fetch'
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
        const newAttendanceStatusData: AttendanceStatusData = {};

        stableLessonIds.forEach(lessonId => {
          const studentCount = lessonStudentData.filter(ls => ls.lesson_id === lessonId).length;
          const attendanceRecords = attendanceData.filter(att => att.lesson_id === lessonId);
          
          // Check if all students are excused
          const excusedCount = attendanceRecords.filter(att => att.attendance_status === 'excused').length;
          const isCancelled = studentCount > 0 && excusedCount === studentCount;
          
          // Check if all students are absent
          const absentCount = attendanceRecords.filter(att => att.attendance_status === 'absent').length;
          const isAbsent = studentCount > 0 && absentCount === studentCount;

          newAttendanceStatusData[lessonId] = {
            isCancelled,
            isAbsent,
            totalStudents: studentCount,
            attendanceCount: attendanceRecords.length
          };
        });

        console.log(`📊 Attendance status processing complete for ${stableLessonIds.length} lessons`);
        setAttendanceStatusData(newAttendanceStatusData);
      } catch (error) {
        console.error('❌ Error fetching attendance status data:', error);
        setAttendanceStatusData({});
      } finally {
        setIsLoading(false);
      }
    };

    fetchAttendanceStatus();
  }, [stableLessonIds.join('|')]);

  return { attendanceStatusData, isLoading };
};
