
import { supabase } from '@/integrations/supabase/client';

export interface CompletedLessonData {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  tutor_id: string;
  subject: string | null;
  tutors: {
    first_name: string;
    last_name: string;
  };
}

export const isLessonCompleted = async (lessonId: string): Promise<boolean> => {
  try {
    // Check if students are enrolled
    const { data: lessonStudents } = await supabase
      .from('lesson_students')
      .select('student_id')
      .eq('lesson_id', lessonId);

    if (!lessonStudents || lessonStudents.length === 0) {
      return false;
    }

    // Check if homework exists
    const { data: homework } = await supabase
      .from('homework')
      .select('id')
      .eq('lesson_id', lessonId);

    if (!homework || homework.length === 0) {
      return false;
    }

    // Check if all students have attendance marked
    const { data: attendanceData } = await supabase
      .from('lesson_attendance')
      .select('student_id')
      .eq('lesson_id', lessonId);

    if (!attendanceData || attendanceData.length === 0) {
      return false;
    }

    // Verify all enrolled students have attendance records
    const enrolledStudentIds = lessonStudents.map(ls => ls.student_id);
    const attendanceStudentIds = attendanceData.map(att => att.student_id);
    
    return enrolledStudentIds.every(studentId => 
      attendanceStudentIds.includes(studentId)
    );
  } catch (error) {
    console.error('Error checking lesson completion:', error);
    return false;
  }
};

export const getCompletedLessons = async (filters: {
  dateRange: { from: Date | null; to: Date | null };
  selectedTutors: string[];
  selectedSubjects: string[];
  isDemoMode?: boolean;
}): Promise<CompletedLessonData[]> => {
  try {
    // Set default date range if not provided (last 60 days)
    const defaultFromDate = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
    const defaultToDate = new Date();
    
    const fromDate = filters.dateRange.from || defaultFromDate;
    let toDate = filters.dateRange.to || defaultToDate;

    // Set toDate to end of day (23:59:59.999) to include all lessons on that date
    if (filters.dateRange.to) {
      toDate = new Date(filters.dateRange.to);
      toDate.setHours(23, 59, 59, 999);
    }

    // Handle empty filters - if no tutors/subjects selected, don't apply filter
    const shouldFilterTutors = filters.selectedTutors.length > 0;
    const shouldFilterSubjects = filters.selectedSubjects.length > 0;

    // Build base query with defaults and ordering
    let query = supabase
      .from('lessons')
      .select(`
        id,
        title,
        start_time,
        end_time,
        tutor_id,
        subject,
        tutors!inner(
          first_name,
          last_name
        )
      `)
      .gte('start_time', fromDate.toISOString())
      .lte('start_time', toDate.toISOString())
      .order('start_time', { ascending: false })
      .limit(1000);

    // Handle large tutor filter arrays by batching
    if (shouldFilterTutors) {
      const BATCH_SIZE = 50;
      if (filters.selectedTutors.length > BATCH_SIZE) {
        // Process in batches for large arrays
        const allLessons: any[] = [];
        for (let i = 0; i < filters.selectedTutors.length; i += BATCH_SIZE) {
          const tutorBatch = filters.selectedTutors.slice(i, i + BATCH_SIZE);
          let batchQuery = supabase
            .from('lessons')
            .select(`
              id,
              title,
              start_time,
              end_time,
              tutor_id,
              subject,
              tutors!inner(
                first_name,
                last_name
              )
            `)
            .in('tutor_id', tutorBatch)
            .gte('start_time', fromDate.toISOString())
            .lte('start_time', toDate.toISOString())
            .order('start_time', { ascending: false });

          // Apply subject filter if needed
          if (shouldFilterSubjects) {
            batchQuery = batchQuery.in('subject', filters.selectedSubjects);
          }

          const { data: batchLessons, error: batchError } = await batchQuery;
          if (batchError) {
            console.error('Error in batch query:', batchError);
            throw batchError;
          }
          if (batchLessons) {
            allLessons.push(...batchLessons);
          }
        }
        
        // Remove duplicates if any
        const uniqueLessons = allLessons.filter((lesson, index, self) => 
          index === self.findIndex(l => l.id === lesson.id)
        );
        
        if (uniqueLessons.length === 0) {
          return [];
        }

        const lessons = uniqueLessons;
        const lessonIds = lessons.map(l => l.id);

        // Get completion data for all lessons
        const completionData = await getCompletionDataForLessons(lessonIds);
        return filterCompletedLessons(lessons, completionData);
      } else {
        query = query.in('tutor_id', filters.selectedTutors);
      }
    }

    // Apply subject filter if needed and not already applied in batch processing
    if (shouldFilterSubjects && filters.selectedTutors.length <= 50) {
      query = query.in('subject', filters.selectedSubjects);
    }

    // Execute single query for non-batched case
    if (!shouldFilterTutors || filters.selectedTutors.length <= 50) {
      const { data: lessons, error: lessonsError } = await query;
      if (lessonsError) {
        console.error('Error fetching lessons:', lessonsError);
        throw lessonsError;
      }

      if (!lessons || lessons.length === 0) {
        return [];
      }

      const lessonIds = lessons.map(l => l.id);

      // Get completion data for all lessons
      const completionData = await getCompletionDataForLessons(lessonIds);
      return filterCompletedLessons(lessons, completionData);
    }

    return [];
  } catch (error) {
    console.error('Error fetching completed lessons:', error);
    return [];
  }
};

// Helper function to chunk arrays
const chunkArray = <T>(array: T[], chunkSize: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
};

// Helper function to get completion data for lesson IDs with batching
export const getCompletionDataForLessons = async (lessonIds: string[]) => {
  if (lessonIds.length === 0) {
    return {
      studentsData: { data: [] },
      homeworkData: { data: [] },
      attendanceData: { data: [] }
    };
  }

  try {
    const chunks = chunkArray(lessonIds, 200);
    let allStudentsData: any[] = [];
    let allHomeworkData: any[] = [];
    let allAttendanceData: any[] = [];
    
    for (const chunk of chunks) {
      const [studentsResult, homeworkResult, attendanceResult] = await Promise.all([
        supabase
          .from('lesson_students')
          .select('lesson_id, student_id')
          .in('lesson_id', chunk),
        supabase
          .from('homework')
          .select('lesson_id')
          .in('lesson_id', chunk),
        supabase
          .from('lesson_attendance')
          .select('lesson_id, student_id, attendance_status')
          .in('lesson_id', chunk)
      ]);

      if (studentsResult.error) throw studentsResult.error;
      if (homeworkResult.error) throw homeworkResult.error;
      if (attendanceResult.error) throw attendanceResult.error;

      allStudentsData.push(...(studentsResult.data || []));
      allHomeworkData.push(...(homeworkResult.data || []));
      allAttendanceData.push(...(attendanceResult.data || []));
    }

    return {
      studentsData: { data: allStudentsData },
      homeworkData: { data: allHomeworkData },
      attendanceData: { data: allAttendanceData }
    };
  } catch (error) {
    console.error('Error fetching completion data:', error);
    throw error;
  }
};

// Helper function to filter completed lessons based on completion data
const filterCompletedLessons = (lessons: any[], completionData: any): CompletedLessonData[] => {
  const { studentsData, homeworkData, attendanceData } = completionData;

  // Group data by lesson_id for efficient lookup
  const lessonStudentsMap = new Map<string, Set<number>>();
  const homeworkLessons = new Set<string>();
  const attendanceMap = new Map<string, Set<number>>();

  studentsData.data?.forEach((item: any) => {
    if (!lessonStudentsMap.has(item.lesson_id)) {
      lessonStudentsMap.set(item.lesson_id, new Set());
    }
    lessonStudentsMap.get(item.lesson_id)!.add(item.student_id);
  });

  homeworkData.data?.forEach((item: any) => {
    homeworkLessons.add(item.lesson_id);
  });

  attendanceData.data?.forEach((item: any) => {
    if (!attendanceMap.has(item.lesson_id)) {
      attendanceMap.set(item.lesson_id, new Set());
    }
    attendanceMap.get(item.lesson_id)!.add(item.student_id);
  });

  // Filter completed lessons
  const completedLessons = lessons.filter(lesson => {
    const enrolledStudents = lessonStudentsMap.get(lesson.id);
    const attendanceStudents = attendanceMap.get(lesson.id);
    const hasHomework = homeworkLessons.has(lesson.id);

    // Check completion criteria
    if (!enrolledStudents || enrolledStudents.size === 0) return false;
    if (!hasHomework) return false;
    if (!attendanceStudents || attendanceStudents.size === 0) return false;

    // Check if all enrolled students have attendance
    for (const studentId of enrolledStudents) {
      if (!attendanceStudents.has(studentId)) {
        return false;
      }
    }

    return true;
  });

  return completedLessons;
};

// New helper functions for batched absence processing
export const getAbsenceStateForLessons = async (lessonIds: string[]): Promise<Set<string>> => {
  if (lessonIds.length === 0) {
    return new Set();
  }

  try {
    const absenceLessons = new Set<string>();
    const chunks = chunkArray(lessonIds, 200);
    
    for (const chunk of chunks) {
      const [studentsResult, attendanceResult] = await Promise.all([
        supabase
          .from('lesson_students')
          .select('lesson_id, student_id')
          .in('lesson_id', chunk),
        
        supabase
          .from('lesson_attendance')
          .select('lesson_id, student_id, attendance_status')
          .in('lesson_id', chunk)
      ]);

      if (studentsResult.error) throw studentsResult.error;
      if (attendanceResult.error) throw attendanceResult.error;

      // Group students by lesson
      const studentsByLesson = new Map<string, Set<number>>();
      studentsResult.data.forEach(item => {
        if (!studentsByLesson.has(item.lesson_id)) {
          studentsByLesson.set(item.lesson_id, new Set());
        }
        studentsByLesson.get(item.lesson_id)!.add(item.student_id);
      });

      // Group attendance by lesson
      const attendanceByLesson = new Map<string, Map<number, string>>();
      attendanceResult.data.forEach(item => {
        if (!attendanceByLesson.has(item.lesson_id)) {
          attendanceByLesson.set(item.lesson_id, new Map());
        }
        attendanceByLesson.get(item.lesson_id)!.set(item.student_id, item.attendance_status);
      });

      // Check which lessons have all students absent
      for (const [lessonId, students] of studentsByLesson) {
        const attendance = attendanceByLesson.get(lessonId);
        if (!attendance) continue;

        const allAbsent = Array.from(students).every(studentId => 
          attendance.get(studentId) === 'absent'
        );

        if (allAbsent && students.size > 0) {
          absenceLessons.add(lessonId);
        }
      }
    }

    return absenceLessons;
  } catch (error) {
    console.error('Error fetching absence state:', error);
    throw error;
  }
};

export const getAbsentStudentNamesForLessons = async (lessonIds: string[]): Promise<Map<string, string[]>> => {
  if (lessonIds.length === 0) {
    return new Map();
  }

  try {
    const studentNamesByLesson = new Map<string, string[]>();
    const chunks = chunkArray(lessonIds, 200);
    
    for (const chunk of chunks) {
      const studentsResult = await supabase
        .from('lesson_students')
        .select(`
          lesson_id,
          student_id,
          students!inner (
            first_name,
            last_name
          )
        `)
        .in('lesson_id', chunk);

      if (studentsResult.error) throw studentsResult.error;

      studentsResult.data.forEach(item => {
        if (!studentNamesByLesson.has(item.lesson_id)) {
          studentNamesByLesson.set(item.lesson_id, []);
        }
        const studentName = `${item.students.first_name} ${item.students.last_name}`;
        studentNamesByLesson.get(item.lesson_id)!.push(studentName);
      });
    }

    return studentNamesByLesson;
  } catch (error) {
    console.error('Error fetching student names:', error);
    throw error;
  }
};
