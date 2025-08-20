
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
    // Get lessons with completion criteria in a single query
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
      `);

    // Apply filters
    if (filters.dateRange.from) {
      query = query.gte('start_time', filters.dateRange.from.toISOString());
    }
    if (filters.dateRange.to) {
      query = query.lte('end_time', filters.dateRange.to.toISOString());
    }
    if (filters.selectedTutors.length > 0) {
      query = query.in('tutor_id', filters.selectedTutors);
    }
    if (filters.selectedSubjects.length > 0) {
      query = query.in('subject', filters.selectedSubjects);
    }

    const { data: lessons, error: lessonsError } = await query;
    if (lessonsError) throw lessonsError;

    if (!lessons || lessons.length === 0) {
      return [];
    }

    const lessonIds = lessons.map(l => l.id);

    // Get all completion data in parallel
    const [studentsData, homeworkData, attendanceData] = await Promise.all([
      supabase
        .from('lesson_students')
        .select('lesson_id, student_id')
        .in('lesson_id', lessonIds),
      supabase
        .from('homework')
        .select('lesson_id')
        .in('lesson_id', lessonIds),
      supabase
        .from('lesson_attendance')
        .select('lesson_id, student_id')
        .in('lesson_id', lessonIds)
    ]);

    if (studentsData.error || homeworkData.error || attendanceData.error) {
      console.error('Error fetching completion data:', {
        studentsError: studentsData.error,
        homeworkError: homeworkData.error,
        attendanceError: attendanceData.error
      });
      return [];
    }

    // Group data by lesson_id for efficient lookup
    const lessonStudentsMap = new Map<string, Set<number>>();
    const homeworkLessons = new Set<string>();
    const attendanceMap = new Map<string, Set<number>>();

    studentsData.data?.forEach(item => {
      if (!lessonStudentsMap.has(item.lesson_id)) {
        lessonStudentsMap.set(item.lesson_id, new Set());
      }
      lessonStudentsMap.get(item.lesson_id)!.add(item.student_id);
    });

    homeworkData.data?.forEach(item => {
      homeworkLessons.add(item.lesson_id);
    });

    attendanceData.data?.forEach(item => {
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
  } catch (error) {
    console.error('Error fetching completed lessons:', error);
    return [];
  }
};
