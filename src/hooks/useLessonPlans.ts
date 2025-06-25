
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface LessonPlan {
  id: string;
  subject: string;
  week_number: number;
  term: string;
  topic_title: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface LessonPlanAssignment {
  id: string;
  lesson_id: string;
  lesson_plan_id: string;
  assigned_week_date: string;
  created_at: string;
  lesson_plan?: LessonPlan;
}

export const useLessonPlans = () => {
  const [lessonPlans, setLessonPlans] = useState<LessonPlan[]>([]);
  const [assignments, setAssignments] = useState<LessonPlanAssignment[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLessonPlans = async (subject?: string) => {
    try {
      setLoading(true);
      let query = supabase
        .from('lesson_plans')
        .select('*')
        .order('week_number', { ascending: true });

      if (subject) {
        query = query.eq('subject', subject);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      setLessonPlans(data || []);
    } catch (error: any) {
      console.error('Error fetching lesson plans:', error);
      toast.error('Failed to fetch lesson plans');
    } finally {
      setLoading(false);
    }
  };

  const fetchLessonPlanAssignments = async (lessonId?: string) => {
    try {
      let query = supabase
        .from('lesson_plan_assignments')
        .select(`
          *,
          lesson_plan:lesson_plans (*)
        `)
        .order('assigned_week_date', { ascending: true });

      if (lessonId) {
        query = query.eq('lesson_id', lessonId);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      setAssignments(data || []);
    } catch (error: any) {
      console.error('Error fetching lesson plan assignments:', error);
      toast.error('Failed to fetch lesson plan assignments');
    }
  };

  const assignLessonPlan = async (
    lessonId: string,
    lessonPlanId: string,
    assignedWeekDate: string
  ) => {
    try {
      const { data, error } = await supabase
        .from('lesson_plan_assignments')
        .insert({
          lesson_id: lessonId,
          lesson_plan_id: lessonPlanId,
          assigned_week_date: assignedWeekDate
        })
        .select()
        .single();

      if (error) throw error;
      
      toast.success('Lesson plan assigned successfully');
      await fetchLessonPlanAssignments();
      return data;
    } catch (error: any) {
      console.error('Error assigning lesson plan:', error);
      toast.error('Failed to assign lesson plan');
      throw error;
    }
  };

  const getCurrentWeekPlan = async (subject: string) => {
    try {
      const { data, error } = await supabase.rpc('get_current_week_number');
      if (error) throw error;

      const currentWeek = data;
      const { data: planData, error: planError } = await supabase
        .from('lesson_plans')
        .select('*')
        .eq('subject', subject)
        .eq('week_number', currentWeek)
        .single();

      return planData;
    } catch (error: any) {
      console.error('Error getting current week plan:', error);
      return null;
    }
  };

  const suggestLessonPlanForDate = async (subject: string, lessonDate: string) => {
    try {
      // Calculate which week of the academic year this date falls into
      const date = new Date(lessonDate);
      const september1 = new Date(date.getFullYear(), 8, 1); // September 1st
      if (date < september1) {
        september1.setFullYear(date.getFullYear() - 1);
      }
      
      const weekDiff = Math.floor((date.getTime() - september1.getTime()) / (7 * 24 * 60 * 60 * 1000));
      const academicWeek = Math.min(Math.max(weekDiff + 1, 1), 52);

      const { data, error } = await supabase
        .from('lesson_plans')
        .select('*')
        .eq('subject', subject)
        .eq('week_number', academicWeek)
        .single();

      return data;
    } catch (error: any) {
      console.error('Error suggesting lesson plan:', error);
      return null;
    }
  };

  useEffect(() => {
    fetchLessonPlans();
    fetchLessonPlanAssignments();
  }, []);

  return {
    lessonPlans,
    assignments,
    loading,
    fetchLessonPlans,
    fetchLessonPlanAssignments,
    assignLessonPlan,
    getCurrentWeekPlan,
    suggestLessonPlanForDate
  };
};
