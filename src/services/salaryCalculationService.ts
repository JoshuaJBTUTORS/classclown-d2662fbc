
import { supabase } from '@/integrations/supabase/client';
import { getCompletedLessons } from './lessonCompletionService';

export interface TutorPayrollData {
  tutor_id: string;
  tutor_name: string;
  normal_hours: number;
  absence_hours: number;
  normal_hourly_rate: number;
  absence_hourly_rate: number;
  normal_pay: number;
  absence_pay: number;
  total_pay: number;
  lessons_completed: number;
  absence_lesson_count: number;
}

export const calculateTutorPayroll = async (filters: {
  dateRange: { from: Date | null; to: Date | null };
  selectedTutors: string[];
  selectedSubjects: string[];
}): Promise<TutorPayrollData[]> => {
  try {
    // Get completed lessons using the proper completion logic
    const completedLessons = await getCompletedLessons(filters);

    // Get tutor rates
    const { data: tutorRates, error: ratesError } = await supabase
      .from('tutors')
      .select('id, first_name, last_name, normal_hourly_rate, absence_hourly_rate');

    if (ratesError) throw ratesError;

    // Create a map for quick tutor rate lookup
    const tutorRatesMap = new Map(
      tutorRates?.map(tutor => [
        tutor.id, 
        {
          name: `${tutor.first_name} ${tutor.last_name}`,
          normal_rate: tutor.normal_hourly_rate || 25.00,
          absence_rate: tutor.absence_hourly_rate || 12.50
        }
      ]) || []
    );

    // Initialize tutor payroll data map
    const tutorPayrollMap = new Map<string, TutorPayrollData>();

    // Process each completed lesson
    for (const lesson of completedLessons) {
      const tutorId = lesson.tutor_id;
      const tutorInfo = tutorRatesMap.get(tutorId);
      
      if (!tutorInfo) continue;

      // Calculate lesson duration
      const start = new Date(lesson.start_time);
      const end = new Date(lesson.end_time);
      const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

      // Check if all students were absent for this lesson
      const { data: lessonStudents } = await supabase
        .from('lesson_students')
        .select('student_id')
        .eq('lesson_id', lesson.id);

      let isAbsenceLesson = false;
      
      if (lessonStudents && lessonStudents.length > 0) {
        const { data: attendanceData } = await supabase
          .from('lesson_attendance')
          .select('student_id, attendance_status')
          .eq('lesson_id', lesson.id);

        if (attendanceData && attendanceData.length > 0) {
          isAbsenceLesson = lessonStudents.every(ls => 
            attendanceData.some(att => 
              att.student_id === ls.student_id && att.attendance_status === 'absent'
            )
          );
        }
      }

      // Initialize or update tutor data
      if (!tutorPayrollMap.has(tutorId)) {
        tutorPayrollMap.set(tutorId, {
          tutor_id: tutorId,
          tutor_name: tutorInfo.name,
          normal_hours: 0,
          absence_hours: 0,
          normal_hourly_rate: tutorInfo.normal_rate,
          absence_hourly_rate: tutorInfo.absence_rate,
          normal_pay: 0,
          absence_pay: 0,
          total_pay: 0,
          lessons_completed: 0,
          absence_lesson_count: 0
        });
      }

      const tutorData = tutorPayrollMap.get(tutorId)!;
      tutorData.lessons_completed++;

      if (isAbsenceLesson) {
        tutorData.absence_hours += duration;
        tutorData.absence_lesson_count++;
      } else {
        tutorData.normal_hours += duration;
      }
    }

    // Calculate pay amounts and finalize data
    const payrollData = Array.from(tutorPayrollMap.values()).map(tutor => {
      const normalPay = tutor.normal_hours * tutor.normal_hourly_rate;
      const absencePay = tutor.absence_hours * tutor.absence_hourly_rate;
      
      return {
        ...tutor,
        normal_hours: Math.round(tutor.normal_hours * 10) / 10,
        absence_hours: Math.round(tutor.absence_hours * 10) / 10,
        normal_pay: Math.round(normalPay * 100) / 100,
        absence_pay: Math.round(absencePay * 100) / 100,
        total_pay: Math.round((normalPay + absencePay) * 100) / 100
      };
    });

    // Sort by total pay descending
    return payrollData.sort((a, b) => b.total_pay - a.total_pay);
  } catch (error) {
    console.error('Error calculating tutor payroll:', error);
    return [];
  }
};
