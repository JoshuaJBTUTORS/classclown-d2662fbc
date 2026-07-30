import { supabase } from '@/integrations/supabase/client';

export interface AdminDashboardData {
  trialLessonsBooked: number;
  trialAttendanceRate: number;
  regularLessonsCount: number;
  activeTutorsCount: number;
  activeCustomersCount: number;
  weeklyTutoringHours: number;
  weeklyLessonCount: number;
}

export const getAdminDashboardData = async (
  period?: { year: number; month: number }
): Promise<AdminDashboardData> => {
  try {
    const now = new Date();
    const year = period?.year ?? now.getFullYear();
    const month = period?.month ?? now.getMonth();
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0, 23, 59, 59, 999);

    // Clamp "past lessons" cutoff to monthEnd so fully past months count all lessons
    const pastCutoff = now < monthEnd ? now : monthEnd;

    // Get trial lessons booked this month
    const { data: trialBookings, error: trialError } = await supabase
      .from('trial_bookings')
      .select('id')
      .gte('created_at', monthStart.toISOString())
      .lte('created_at', monthEnd.toISOString());

    if (trialError) throw trialError;

    // Get trial lesson attendance rate for the selected month (only past lessons)
    const { data: trialLessons, error: trialLessonsError } = await supabase
      .from('lessons')
      .select(`
        id,
        lesson_attendance (
          id,
          attendance_status
        )
      `)
      .eq('lesson_type', 'trial')
      .gte('start_time', monthStart.toISOString())
      .lte('start_time', monthEnd.toISOString())
      .lt('start_time', pastCutoff.toISOString());

    if (trialLessonsError) throw trialLessonsError;

    let attendedCount = 0;
    const totalPastTrialLessons = trialLessons?.length || 0;

    trialLessons?.forEach(lesson => {
      if (lesson.lesson_attendance && lesson.lesson_attendance.length > 0) {
        lesson.lesson_attendance.forEach((attendance: any) => {
          if (attendance.attendance_status === 'attended' || attendance.attendance_status === 'late') {
            attendedCount++;
          }
        });
      }
    });

    const trialAttendanceRate = totalPastTrialLessons > 0
      ? Math.round((attendedCount / totalPastTrialLessons) * 100)
      : 0;

    // Get regular scheduled lessons in the selected month
    const { data: regularLessons, error: regularError } = await supabase
      .from('lessons')
      .select('id')
      .neq('lesson_type', 'trial')
      .gte('start_time', monthStart.toISOString())
      .lte('start_time', monthEnd.toISOString());

    if (regularError) throw regularError;

    const { data: tutors, error: tutorsError } = await supabase
      .from('tutors')
      .select('id')
      .or('status.is.null,status.eq.active');

    if (tutorsError) throw tutorsError;

    const { data: activeStudents, error: studentsError } = await supabase
      .from('lesson_students')
      .select(`
        student_id,
        lessons!inner(start_time)
      `)
      .gte('lessons.start_time', monthStart.toISOString())
      .lte('lessons.start_time', monthEnd.toISOString());

    if (studentsError) throw studentsError;

    const uniqueStudentIds = new Set(activeStudents?.map(ls => ls.student_id) || []);
    const activeCustomersCount = uniqueStudentIds.size;

    // Weekly tutoring hours (student-hours) for the CURRENT week, Mon 00:00 - Sun 23:59
    const weekStart = new Date(now);
    const day = (weekStart.getDay() + 6) % 7; // 0 = Monday
    weekStart.setDate(weekStart.getDate() - day);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const { data: weekLessons, error: weekError } = await supabase
      .from('lessons')
      .select(`
        id,
        start_time,
        end_time,
        status,
        cancelled_at,
        lesson_students ( student_id )
      `)
      .neq('lesson_type', 'trial')
      .gte('start_time', weekStart.toISOString())
      .lte('start_time', weekEnd.toISOString());

    if (weekError) throw weekError;

    let weeklyTutoringHours = 0;
    let weeklyLessonCount = 0;

    (weekLessons || []).forEach((lesson: any) => {
      if (lesson.cancelled_at) return;
      if (lesson.status === 'cancelled') return;

      const students = Array.isArray(lesson.lesson_students) ? lesson.lesson_students.length : 0;
      if (students === 0) return;

      const durationHours =
        (new Date(lesson.end_time).getTime() - new Date(lesson.start_time).getTime()) / (1000 * 60 * 60);
      if (!isFinite(durationHours) || durationHours <= 0) return;

      weeklyTutoringHours += durationHours * students;
      weeklyLessonCount++;
    });

    return {
      trialLessonsBooked: trialBookings?.length || 0,
      trialAttendanceRate,
      regularLessonsCount: regularLessons?.length || 0,
      activeTutorsCount: tutors?.length || 0,
      activeCustomersCount,
      weeklyTutoringHours: Math.round(weeklyTutoringHours * 10) / 10,
      weeklyLessonCount,
    };
  } catch (error) {
    console.error('Error fetching admin dashboard data:', error);
    throw error;
  }
};
