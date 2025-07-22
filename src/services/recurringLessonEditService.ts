
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

export interface LessonUpdate {
  title?: string;
  description?: string;
  subject?: string;
  tutor_id?: string;
  start_time?: string;
  end_time?: string;
  is_group?: boolean;
  selectedStudents?: number[];
}

export enum EditScope {
  THIS_LESSON_ONLY = 'this_lesson_only',
  ALL_FUTURE_LESSONS = 'all_future_lessons'
}

export interface EditRecurringOptions {
  editScope: EditScope;
  affectedLessonsCount?: number;
  isRecurringLesson: boolean;
  isRecurringInstance: boolean;
  parentLessonId?: string;
  instanceDate?: string;
}

// Update only a single recurring instance
export const updateSingleRecurringInstance = async (
  lessonId: string, 
  updates: LessonUpdate
): Promise<void> => {
  console.log('Updating single recurring instance:', lessonId);
  
  const { selectedStudents, ...lessonData } = updates;
  
  // Update the lesson
  const { error: lessonError } = await supabase
    .from('lessons')
    .update(lessonData)
    .eq('id', lessonId);
  
  if (lessonError) throw lessonError;
  
  // Update students if provided
  if (selectedStudents) {
    // Delete existing lesson_students entries
    const { error: deleteError } = await supabase
      .from('lesson_students')
      .delete()
      .eq('lesson_id', lessonId);
    
    if (deleteError) throw deleteError;
    
    // Add updated students
    if (selectedStudents.length > 0) {
      const lessonStudentsData = selectedStudents.map(studentId => ({
        lesson_id: lessonId,
        student_id: studentId
      }));
      
      const { error: studentsError } = await supabase
        .from('lesson_students')
        .insert(lessonStudentsData);
      
      if (studentsError) throw studentsError;
    }
  }
  
  console.log('Successfully updated single recurring instance');
};

// Update all future instances from a specific date forward
export const updateAllFutureLessons = async (
  lessonId: string,
  updates: LessonUpdate,
  fromDate?: string
): Promise<number> => {
  console.log('Updating all future lessons from:', fromDate);
  
  const { selectedStudents, ...lessonData } = updates;
  
  // Get the lesson to determine if it's a parent or instance
  const { data: currentLesson } = await supabase
    .from('lessons')
    .select('*, parent_lesson_id, is_recurring, is_recurring_instance, instance_date')
    .eq('id', lessonId)
    .single();
  
  if (!currentLesson) throw new Error('Lesson not found');
  
  let parentLessonId: string;
  let updateFromDate: string;
  
  if (currentLesson.is_recurring_instance && currentLesson.parent_lesson_id) {
    // Editing an instance - update parent and all future instances
    parentLessonId = currentLesson.parent_lesson_id;
    updateFromDate = currentLesson.instance_date || format(new Date(currentLesson.start_time), 'yyyy-MM-dd');
  } else {
    // Editing the parent lesson
    parentLessonId = lessonId;
    updateFromDate = fromDate || format(new Date(), 'yyyy-MM-dd');
  }
  
  // Update the parent lesson
  const { error: parentError } = await supabase
    .from('lessons')
    .update(lessonData)
    .eq('id', parentLessonId);
  
  if (parentError) throw parentError;
  
  // Get all future instances to update
  const { data: futureInstances, error: instancesError } = await supabase
    .from('lessons')
    .select('id')
    .eq('parent_lesson_id', parentLessonId)
    .eq('is_recurring_instance', true)
    .gte('instance_date', updateFromDate);
  
  if (instancesError) throw instancesError;
  
  let updatedCount = 1; // Parent lesson
  
  if (futureInstances && futureInstances.length > 0) {
    // Update all future instances
    const instanceIds = futureInstances.map(instance => instance.id);
    
    const { error: updateError } = await supabase
      .from('lessons')
      .update(lessonData)
      .in('id', instanceIds);
    
    if (updateError) throw updateError;
    
    updatedCount += instanceIds.length;
    
    // Update students for all affected lessons if provided
    if (selectedStudents) {
      const allLessonIds = [parentLessonId, ...instanceIds];
      
      // Delete existing lesson_students entries for all lessons
      const { error: deleteError } = await supabase
        .from('lesson_students')
        .delete()
        .in('lesson_id', allLessonIds);
      
      if (deleteError) throw deleteError;
      
      // Add updated students for all lessons
      if (selectedStudents.length > 0) {
        const lessonStudentsData = allLessonIds.flatMap(lessonId =>
          selectedStudents.map(studentId => ({
            lesson_id: lessonId,
            student_id: studentId
          }))
        );
        
        const { error: studentsError } = await supabase
          .from('lesson_students')
          .insert(lessonStudentsData);
        
        if (studentsError) throw studentsError;
      }
    }
  } else if (selectedStudents) {
    // Update students for parent lesson only
    const { error: deleteError } = await supabase
      .from('lesson_students')
      .delete()
      .eq('lesson_id', parentLessonId);
    
    if (deleteError) throw deleteError;
    
    if (selectedStudents.length > 0) {
      const lessonStudentsData = selectedStudents.map(studentId => ({
        lesson_id: parentLessonId,
        student_id: studentId
      }));
      
      const { error: studentsError } = await supabase
        .from('lesson_students')
        .insert(lessonStudentsData);
      
      if (studentsError) throw studentsError;
    }
  }
  
  console.log(`Successfully updated ${updatedCount} lessons`);
  return updatedCount;
};

// Get count of affected lessons for preview
export const getAffectedLessonsCount = async (
  lessonId: string,
  editScope: EditScope
): Promise<number> => {
  if (editScope === EditScope.THIS_LESSON_ONLY) {
    return 1;
  }
  
  // Get the lesson to determine structure
  const { data: currentLesson } = await supabase
    .from('lessons')
    .select('parent_lesson_id, is_recurring, is_recurring_instance, instance_date, start_time')
    .eq('id', lessonId)
    .single();
  
  if (!currentLesson) return 0;
  
  let parentLessonId: string;
  let fromDate: string;
  
  if (currentLesson.is_recurring_instance && currentLesson.parent_lesson_id) {
    parentLessonId = currentLesson.parent_lesson_id;
    fromDate = currentLesson.instance_date || format(new Date(currentLesson.start_time), 'yyyy-MM-dd');
  } else {
    parentLessonId = lessonId;
    fromDate = format(new Date(), 'yyyy-MM-dd');
  }
  
  // Count future instances
  const { count, error } = await supabase
    .from('lessons')
    .select('*', { count: 'exact', head: true })
    .eq('parent_lesson_id', parentLessonId)
    .eq('is_recurring_instance', true)
    .gte('instance_date', fromDate);
  
  if (error) {
    console.error('Error counting affected lessons:', error);
    return 0;
  }
  
  return (count || 0) + 1; // +1 for parent lesson
};
