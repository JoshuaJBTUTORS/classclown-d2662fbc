
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface RecurringLessonGroup {
  id: string;
  original_lesson_id: string;
  group_name: string;
  recurrence_pattern: any;
  next_extension_date: string | null;
  created_at: string;
  updated_at: string;
}

export const useRecurringLessons = () => {
  const [recurringGroups, setRecurringGroups] = useState<RecurringLessonGroup[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRecurringGroups = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('recurring_lesson_groups')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRecurringGroups(data || []);
    } catch (error: any) {
      console.error('Error fetching recurring groups:', error);
      toast.error('Failed to fetch recurring lessons');
    } finally {
      setLoading(false);
    }
  };

  const createRecurringGroup = async (
    originalLessonId: string,
    groupName: string,
    recurrencePattern: any
  ) => {
    try {
      const nextExtensionDate = new Date();
      nextExtensionDate.setMonth(nextExtensionDate.getMonth() + 3);

      const { data, error } = await supabase
        .from('recurring_lesson_groups')
        .insert({
          original_lesson_id: originalLessonId,
          group_name: groupName,
          recurrence_pattern: recurrencePattern,
          next_extension_date: nextExtensionDate.toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Create initial 3-month batch of lessons
      await createRecurringLessons(originalLessonId, recurrencePattern);
      
      toast.success('Recurring lesson group created successfully');
      await fetchRecurringGroups();
      return data;
    } catch (error: any) {
      console.error('Error creating recurring group:', error);
      toast.error('Failed to create recurring lesson group');
      throw error;
    }
  };

  const createRecurringLessons = async (originalLessonId: string, pattern: any) => {
    try {
      // Get the original lesson details
      const { data: originalLesson, error: lessonError } = await supabase
        .from('lessons')
        .select(`
          *,
          lesson_students (
            student_id
          )
        `)
        .eq('id', originalLessonId)
        .single();

      if (lessonError) throw lessonError;

      const startDate = new Date(originalLesson.start_time);
      const endDate = new Date(originalLesson.end_time);
      const lessonDuration = endDate.getTime() - startDate.getTime();

      const lessons = [];
      const currentDate = new Date(startDate);
      const threeMonthsLater = new Date();
      threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3);

      let daysToAdd = 7; // default weekly
      if (pattern.interval === 'daily') daysToAdd = 1;
      else if (pattern.interval === 'biweekly') daysToAdd = 14;
      else if (pattern.interval === 'monthly') daysToAdd = 30;

      // Create lessons for the next 3 months
      while (currentDate <= threeMonthsLater) {
        currentDate.setDate(currentDate.getDate() + daysToAdd);
        
        if (currentDate <= threeMonthsLater) {
          const newStartTime = new Date(currentDate);
          const newEndTime = new Date(currentDate.getTime() + lessonDuration);

          const lessonData = {
            title: originalLesson.title,
            description: originalLesson.description,
            tutor_id: originalLesson.tutor_id,
            start_time: newStartTime.toISOString(),
            end_time: newEndTime.toISOString(),
            is_group: originalLesson.is_group,
            status: 'scheduled',
            subject: originalLesson.subject,
            lesson_type: originalLesson.lesson_type || 'regular',
            is_recurring: false, // Individual instances are not recurring
            recurrence_interval: null,
            recurrence_day: null,
            recurrence_end_date: null
          };

          lessons.push(lessonData);
        }
      }

      // Insert all lessons
      const { data: createdLessons, error: insertError } = await supabase
        .from('lessons')
        .insert(lessons)
        .select();

      if (insertError) throw insertError;

      // Copy student assignments for each lesson
      if (originalLesson.lesson_students && createdLessons) {
        const studentAssignments = createdLessons.flatMap(lesson =>
          originalLesson.lesson_students.map((ls: any) => ({
            lesson_id: lesson.id,
            student_id: ls.student_id
          }))
        );

        const { error: studentsError } = await supabase
          .from('lesson_students')
          .insert(studentAssignments);

        if (studentsError) throw studentsError;
      }

      console.log(`Created ${createdLessons.length} recurring lessons`);
      return createdLessons;
    } catch (error: any) {
      console.error('Error creating recurring lessons:', error);
      throw error;
    }
  };

  const extendRecurringLessons = async () => {
    try {
      const { error } = await supabase.rpc('extend_recurring_lessons');
      if (error) throw error;
      
      toast.success('Recurring lessons extended successfully');
      await fetchRecurringGroups();
    } catch (error: any) {
      console.error('Error extending recurring lessons:', error);
      toast.error('Failed to extend recurring lessons');
    }
  };

  useEffect(() => {
    fetchRecurringGroups();
  }, []);

  return {
    recurringGroups,
    loading,
    createRecurringGroup,
    extendRecurringLessons,
    refetch: fetchRecurringGroups
  };
};
