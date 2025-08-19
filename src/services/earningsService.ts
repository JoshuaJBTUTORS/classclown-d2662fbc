import { supabase } from '@/integrations/supabase/client';
import { getCompletedLessons } from './lessonCompletionService';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

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
    const startDate = period === 'weekly' 
      ? startOfWeek(now, { weekStartsOn: 1 })
      : startOfMonth(now);

    const { data, error } = await supabase
      .from('tutor_earning_goals')
      .select('*')
      .eq('tutor_id', tutorId)
      .eq('goal_period', period)
      .lte('goal_start_date', format(startDate, 'yyyy-MM-dd'))
      .order('goal_start_date', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
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
    const startDate = period === 'weekly' 
      ? startOfWeek(now, { weekStartsOn: 1 })
      : startOfMonth(now);

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
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error setting tutor earning goal:', error);
    throw error;
  }
};

export const calculateTutorEarnings = async (
  tutorId: string,
  period: 'weekly' | 'monthly' = 'monthly'
): Promise<number> => {
  try {
    const now = new Date();
    const periodStart = period === 'weekly' 
      ? startOfWeek(now, { weekStartsOn: 1 })
      : startOfMonth(now);
    const periodEnd = period === 'weekly' 
      ? endOfWeek(now, { weekStartsOn: 1 })
      : endOfMonth(now);

    // Get tutor's hourly rate
    const { data: tutorData, error: tutorError } = await supabase
      .from('tutors')
      .select('normal_hourly_rate')
      .eq('id', tutorId)
      .single();

    if (tutorError) throw tutorError;

    const hourlyRate = tutorData?.normal_hourly_rate || 0;

    // Get completed lessons for the period
    const completedLessons = await getCompletedLessons({
      dateRange: { from: periodStart, to: periodEnd },
      selectedTutors: [tutorId],
      selectedSubjects: []
    });

    // Calculate total earnings
    let totalEarnings = 0;
    for (const lesson of completedLessons) {
      const startTime = new Date(lesson.start_time);
      const endTime = new Date(lesson.end_time);
      const durationHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
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
  period: 'weekly' | 'monthly' = 'monthly'
): Promise<EarningsData> => {
  try {
    const [goal, currentEarnings] = await Promise.all([
      getTutorEarningGoal(tutorId, period),
      calculateTutorEarnings(tutorId, period)
    ]);

    const now = new Date();
    const periodStart = period === 'weekly' 
      ? startOfWeek(now, { weekStartsOn: 1 })
      : startOfMonth(now);
    const periodEnd = period === 'weekly' 
      ? endOfWeek(now, { weekStartsOn: 1 })
      : endOfMonth(now);

    const goalAmount = goal?.goal_amount || 0;
    const progressPercentage = goalAmount > 0 ? Math.min((currentEarnings / goalAmount) * 100, 100) : 0;
    const remainingAmount = Math.max(goalAmount - currentEarnings, 0);

    // Get completed lessons count for the period
    const completedLessons = await getCompletedLessons({
      dateRange: { from: periodStart, to: periodEnd },
      selectedTutors: [tutorId],
      selectedSubjects: []
    });

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