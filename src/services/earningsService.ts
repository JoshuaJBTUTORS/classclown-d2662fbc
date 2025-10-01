import { supabase } from '@/integrations/supabase/client';
import { getCompletedLessons, getAbsenceStateForLessons } from './lessonCompletionService';
import { format } from 'date-fns';
import { getEarningsPeriod } from '@/utils/earningsPeriodUtils';

export interface TutorEarningGoal {
  id: string;
  tutor_id: string;
  goal_amount: number;
  goal_period: string;
  goal_start_date: string;
  created_at: string;
  updated_at: string;
}

export interface EarningsData {
  currentEarnings: number;
  goalAmount: number;
  completedLessons: number;
  progressPercentage: number;
  remainingAmount: number;
  period: 'weekly' | 'monthly';
  periodStart: Date;
  periodEnd: Date;
}

export const getTutorEarningGoal = async (tutorId: string, period: 'weekly' | 'monthly' = 'monthly'): Promise<TutorEarningGoal | null> => {
  try {
    const now = new Date();
    const { start: startDate } = getEarningsPeriod(now, period);

    const { data, error } = await supabase
      .from('tutor_earning_goals')
      .select('*')
      .eq('tutor_id', tutorId)
      .eq('goal_period', period)
      .lte('goal_start_date', format(startDate, 'yyyy-MM-dd'))
      .order('goal_start_date', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error fetching tutor earning goal:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error fetching tutor earning goal:', error);
    return null;
  }
};

export const setTutorEarningGoal = async (
  tutorId: string,
  goalAmount: number,
  period: 'weekly' | 'monthly'
): Promise<TutorEarningGoal> => {
  try {
    const now = new Date();
    const { start: startDate } = getEarningsPeriod(now, period);

    const { data, error } = await supabase
      .from('tutor_earning_goals')
      .upsert({
        tutor_id: tutorId,
        goal_amount: goalAmount,
        goal_period: period,
        goal_start_date: format(startDate, 'yyyy-MM-dd'),
      }, {
        onConflict: 'tutor_id,goal_period,goal_start_date'
      })
      .select()
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error('Failed to create/update earning goal');
    return data;
  } catch (error) {
    console.error('Error setting tutor earning goal:', error);
    throw error;
  }
};

export const calculateTutorEarnings = async (
  tutorId: string,
  period: 'weekly' | 'monthly' = 'monthly',
  referenceDate: Date = new Date()
): Promise<number> => {
  try {
    const { start: periodStart, end: periodEnd } = getEarningsPeriod(referenceDate, period);

    // Get tutor's hourly rates
    const { data: tutorData, error: tutorError } = await supabase
      .from('tutors')
      .select('normal_hourly_rate, absence_hourly_rate')
      .eq('id', tutorId)
      .single();

    if (tutorError) throw tutorError;

    const normalHourlyRate = tutorData?.normal_hourly_rate || 0;
    const absenceHourlyRate = tutorData?.absence_hourly_rate || 0;

    // Get completed lessons for the period
    const completedLessons = await getCompletedLessons({
      dateRange: { from: periodStart, to: periodEnd },
      selectedTutors: [tutorId],
      selectedSubjects: []
    });

    // Get absence states for all completed lessons
    const lessonIds = completedLessons.map(lesson => lesson.id);
    const absenceLessonIds = await getAbsenceStateForLessons(lessonIds);

    // Calculate total earnings with proper rate application
    let totalEarnings = 0;
    for (const lesson of completedLessons) {
      const startTime = new Date(lesson.start_time);
      const endTime = new Date(lesson.end_time);
      const durationHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
      
      // Use absence rate if all students were absent, otherwise normal rate
      const hourlyRate = absenceLessonIds.has(lesson.id) ? absenceHourlyRate : normalHourlyRate;
      totalEarnings += durationHours * hourlyRate;
    }

    return Math.round(totalEarnings * 100) / 100; // Round to 2 decimal places
  } catch (error) {
    console.error('Error calculating tutor earnings:', error);
    return 0;
  }
};

export const getTutorEarningsData = async (
  tutorId: string,
  period: 'weekly' | 'monthly' = 'monthly',
  referenceDate: Date = new Date()
): Promise<EarningsData> => {
  try {
    const { start: periodStart, end: periodEnd } = getEarningsPeriod(referenceDate, period);

    // Get all data in parallel - fetch completed lessons only once
    const [goal, tutorData, completedLessons] = await Promise.all([
      getTutorEarningGoal(tutorId, period),
      supabase
        .from('tutors')
        .select('normal_hourly_rate, absence_hourly_rate')
        .eq('id', tutorId)
        .maybeSingle(),
      getCompletedLessons({
        dateRange: { from: periodStart, to: periodEnd },
        selectedTutors: [tutorId],
        selectedSubjects: []
      })
    ]);

    if (tutorData.error) {
      console.error('Error fetching tutor data:', tutorData.error);
    }

    const normalHourlyRate = tutorData.data?.normal_hourly_rate || 0;
    const absenceHourlyRate = tutorData.data?.absence_hourly_rate || 0;

    // Get absence states for all completed lessons
    const lessonIds = completedLessons.map(lesson => lesson.id);
    const absenceLessonIds = await getAbsenceStateForLessons(lessonIds);

    // Calculate earnings from the already-fetched completed lessons with proper rate application
    let currentEarnings = 0;
    for (const lesson of completedLessons) {
      const startTime = new Date(lesson.start_time);
      const endTime = new Date(lesson.end_time);
      const durationHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
      
      // Use absence rate if all students were absent, otherwise normal rate
      const hourlyRate = absenceLessonIds.has(lesson.id) ? absenceHourlyRate : normalHourlyRate;
      currentEarnings += durationHours * hourlyRate;
    }

    currentEarnings = Math.round(currentEarnings * 100) / 100; // Round to 2 decimal places

    const goalAmount = goal?.goal_amount || 0;
    const progressPercentage = goalAmount > 0 ? Math.min((currentEarnings / goalAmount) * 100, 100) : 0;
    const remainingAmount = Math.max(goalAmount - currentEarnings, 0);

    return {
      currentEarnings,
      goalAmount,
      completedLessons: completedLessons.length,
      progressPercentage,
      remainingAmount,
      period,
      periodStart,
      periodEnd
    };
  } catch (error) {
    console.error('Error getting tutor earnings data:', error);
    return {
      currentEarnings: 0,
      goalAmount: 0,
      completedLessons: 0,
      progressPercentage: 0,
      remainingAmount: 0,
      period,
      periodStart: new Date(),
      periodEnd: new Date()
    };
  }
};