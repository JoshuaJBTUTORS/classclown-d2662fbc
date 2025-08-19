import { supabase } from '@/integrations/supabase/client';
import { format, addDays, addWeeks, differenceInMinutes, getDay, setDay } from 'date-fns';

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

const recreateLessonSpaceRoom = async (lessonId: string) => {
  try {
    console.log('Recreating LessonSpace room for lesson:', lessonId);
    
    const { data, error } = await supabase.functions.invoke('lesson-space-integration', {
      body: {
        action: 'create-room',
        lessonId: lessonId,
        title: 'Updated Lesson Room',
        startTime: new Date().toISOString(),
        duration: 60
      }
    });

    if (error) {
      console.error('Error recreating LessonSpace room:', error);
      return null;
    }

    if (data && data.success) {
      console.log('LessonSpace room recreated successfully:', data);
      return data;
    }
    
    return null;
  } catch (error) {
    console.error('Error in recreateLessonSpaceRoom:', error);
    return null;
  }
};

// Update only a single recurring instance
export const updateSingleRecurringInstance = async (
  lessonId: string, 
  updates: LessonUpdate
): Promise<void> => {
  console.log('Updating single recurring instance:', lessonId);
  
  const { selectedStudents, ...lessonData } = updates;
  
  // Check if tutor is changing
  const tutorChanged = updates.tutor_id !== undefined;
  
  // Check if students are changing
  const studentsChanged = selectedStudents !== undefined;
  
  // Update the lesson
  const { error: lessonError } = await supabase
    .from('lessons')
    .update(lessonData)
    .eq('id', lessonId);
  
  if (lessonError) throw lessonError;
  
  // Update students if provided
  if (studentsChanged && selectedStudents) {
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
  
  // Recreate LessonSpace room if tutor or students changed
  if (tutorChanged || studentsChanged) {
    console.log('Tutor or students changed, recreating LessonSpace room');
    const roomData = await recreateLessonSpaceRoom(lessonId);
    if (!roomData) {
      console.warn('Failed to recreate room for lesson after tutor/student change');
    }
  }
  
  console.log('Successfully updated single recurring instance');
};

// Calculate the changes between original and new lesson data
const calculateLessonChanges = (originalLesson: any, updates: LessonUpdate) => {
  const changes: any = {};
  
  // Handle non-date/time fields directly
  if (updates.title && updates.title !== originalLesson.title) {
    changes.title = updates.title;
  }
  if (updates.description !== undefined && updates.description !== originalLesson.description) {
    changes.description = updates.description;
  }
  if (updates.subject && updates.subject !== originalLesson.subject) {
    changes.subject = updates.subject;
  }
  if (updates.tutor_id && updates.tutor_id !== originalLesson.tutor_id) {
    changes.tutor_id = updates.tutor_id;
    changes.tutorChanged = true; // Flag to indicate tutor change
  }
  if (updates.is_group !== undefined && updates.is_group !== originalLesson.is_group) {
    changes.is_group = updates.is_group;
  }
  
  // Handle date/time changes
  if (updates.start_time || updates.end_time) {
    const originalStart = new Date(originalLesson.start_time);
    const originalEnd = new Date(originalLesson.end_time);
    const originalDayOfWeek = getDay(originalStart);
    
    if (updates.start_time) {
      const newStart = new Date(updates.start_time);
      const newDayOfWeek = getDay(newStart);
      
      // Calculate time difference (in minutes from start of day)
      const originalTimeOfDay = originalStart.getHours() * 60 + originalStart.getMinutes();
      const newTimeOfDay = newStart.getHours() * 60 + newStart.getMinutes();
      const timeDifference = newTimeOfDay - originalTimeOfDay;
      
      changes.timeDifference = timeDifference;
      changes.dayOfWeekChange = newDayOfWeek - originalDayOfWeek;
    }
    
    if (updates.end_time) {
      const newEnd = new Date(updates.end_time);
      const newStart = updates.start_time ? new Date(updates.start_time) : originalStart;
      const newDuration = differenceInMinutes(newEnd, newStart);
      const originalDuration = differenceInMinutes(originalEnd, originalStart);
      
      changes.durationChange = newDuration - originalDuration;
    }
  }
  
  return changes;
};

// Apply calculated changes to a specific lesson instance
const applyChangesToInstance = (instanceLesson: any, changes: any) => {
  const updateData: any = {};
  
  // Apply non-date/time changes directly
  if (changes.title) updateData.title = changes.title;
  if (changes.description !== undefined) updateData.description = changes.description;
  if (changes.subject) updateData.subject = changes.subject;
  if (changes.tutor_id) updateData.tutor_id = changes.tutor_id;
  if (changes.is_group !== undefined) updateData.is_group = changes.is_group;
  
  // Apply date/time changes while preserving the instance's weekly pattern
  if (changes.timeDifference !== undefined || changes.dayOfWeekChange !== undefined || changes.durationChange !== undefined) {
    const currentStart = new Date(instanceLesson.start_time);
    const currentEnd = new Date(instanceLesson.end_time);
    
    let newStart = new Date(currentStart);
    let newEnd = new Date(currentEnd);
    
    // Apply day of week change
    if (changes.dayOfWeekChange !== undefined && changes.dayOfWeekChange !== 0) {
      const currentDayOfWeek = getDay(newStart);
      let targetDayOfWeek = currentDayOfWeek + changes.dayOfWeekChange;
      
      // Handle week wrapping
      if (targetDayOfWeek > 6) {
        targetDayOfWeek = targetDayOfWeek - 7;
        newStart = addWeeks(newStart, 1);
        newEnd = addWeeks(newEnd, 1);
      } else if (targetDayOfWeek < 0) {
        targetDayOfWeek = targetDayOfWeek + 7;
        newStart = addWeeks(newStart, -1);
        newEnd = addWeeks(newEnd, -1);
      }
      
      newStart = setDay(newStart, targetDayOfWeek);
      newEnd = setDay(newEnd, targetDayOfWeek);
    }
    
    // Apply time difference
    if (changes.timeDifference !== undefined && changes.timeDifference !== 0) {
      const minutesToAdd = changes.timeDifference;
      newStart.setMinutes(newStart.getMinutes() + minutesToAdd);
      newEnd.setMinutes(newEnd.getMinutes() + minutesToAdd);
    }
    
    // Apply duration change
    if (changes.durationChange !== undefined && changes.durationChange !== 0) {
      newEnd.setMinutes(newEnd.getMinutes() + changes.durationChange);
    }
    
    updateData.start_time = newStart.toISOString();
    updateData.end_time = newEnd.toISOString();
  }
  
  return updateData;
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
  
  // Get the original parent lesson data to calculate changes
  const { data: originalParentLesson } = await supabase
    .from('lessons')
    .select('*')
    .eq('id', parentLessonId)
    .single();
    
  if (!originalParentLesson) throw new Error('Parent lesson not found');
  
  // Calculate what changes need to be applied
  const changes = calculateLessonChanges(originalParentLesson, updates);
  console.log('Calculated changes:', changes);
  console.log('Editing child instance:', currentLesson.is_recurring_instance);
  console.log('Update from date:', updateFromDate);
  
  // Only update the parent lesson if we're editing the parent lesson itself
  // When editing a child instance, we should NOT update the parent lesson
  if (!currentLesson.is_recurring_instance) {
    console.log('Updating parent lesson as we are editing the parent');
    const parentUpdateData = applyChangesToInstance(originalParentLesson, changes);
    
    const { error: parentError } = await supabase
      .from('lessons')
      .update(parentUpdateData)
      .eq('id', parentLessonId);
    
    if (parentError) throw parentError;
  } else {
    console.log('Skipping parent lesson update as we are editing a child instance');
  }
  
  // Get all future instances to update
  const { data: futureInstances, error: instancesError } = await supabase
    .from('lessons')
    .select('*')
    .eq('parent_lesson_id', parentLessonId)
    .eq('is_recurring_instance', true)
    .gte('instance_date', updateFromDate);
  
  if (instancesError) throw instancesError;
  
  // Count updated lessons (only count parent if it was actually updated)
  let updatedCount = currentLesson.is_recurring_instance ? 0 : 1;
  
  if (futureInstances && futureInstances.length > 0) {
    // Update each instance individually with calculated changes
    for (const instance of futureInstances) {
      const instanceUpdateData = applyChangesToInstance(instance, changes);
      
      const { error: updateError } = await supabase
        .from('lessons')
        .update(instanceUpdateData)
        .eq('id', instance.id);
      
      if (updateError) {
        console.error(`Failed to update instance ${instance.id}:`, updateError);
        continue;
      }
      
      updatedCount++;
    }
    
    // Update students for all affected lessons if provided
    if (selectedStudents) {
      // Only include parent lesson ID if we actually updated the parent lesson
      const allLessonIds = currentLesson.is_recurring_instance 
        ? futureInstances.map(i => i.id)
        : [parentLessonId, ...futureInstances.map(i => i.id)];
      
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
  
  // Recreate LessonSpace room for all affected lessons if tutor or students changed
  if (changes.tutorChanged || selectedStudents !== undefined) {
    console.log('Tutor or students changed, recreating LessonSpace rooms for all affected lessons');
    // Only include parent lesson ID if we actually updated the parent lesson
    const allLessonIds = currentLesson.is_recurring_instance 
      ? (futureInstances?.map(i => i.id) || [])
      : [parentLessonId, ...(futureInstances?.map(i => i.id) || [])];
    
    for (const lessonId of allLessonIds) {
      const roomData = await recreateLessonSpaceRoom(lessonId);
      if (!roomData) {
        console.warn(`Failed to recreate room for lesson ${lessonId} after tutor/student change`);
      }
    }
  }
  
  console.log(`Successfully updated ${updatedCount} lessons with LessonSpace rooms`);
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
  
  // Only count parent lesson if we're editing the parent lesson itself
  // When editing a child instance, don't count the parent lesson
  const parentLessonCount = currentLesson.is_recurring_instance ? 0 : 1;
  return (count || 0) + parentLessonCount;
};
