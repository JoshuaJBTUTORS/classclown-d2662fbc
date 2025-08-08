
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

    const { data: lessons, error } = await query;

    if (error) throw error;

    // Filter lessons that meet completion criteria
    const completedLessons: CompletedLessonData[] = [];

    for (const lesson of lessons || []) {
      const isCompleted = await isLessonCompleted(lesson.id);
      if (isCompleted) {
        completedLessons.push(lesson);
      }
    }

    return completedLessons;
  } catch (error) {
    console.error('Error fetching completed lessons:', error);
    return [];
  }
};
