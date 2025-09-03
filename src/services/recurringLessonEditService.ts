import { supabase } from '@/integrations/supabase/client';
import { format, addDays, addWeeks, differenceInMinutes, getDay, setDay, parseISO } from 'date-fns';
import { createUKDateTime, convertUKToUTC, convertUTCToUK } from '@/utils/timezone';

export interface LessonUpdate {
  title?: string;
  description?: string;
  subject?: string;
  tutor_id?: string;
  start_time?: string;
  end_time?: string;
  is_group?: boolean;
  selectedStudents?: number[];
  student_ids?: number[];
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

// Create update data (non-time fields only, time will be calculated per instance)
const createUpdateData = (updates: LessonUpdate) => {
  const updateData: any = {};
  
  if (updates.title) updateData.title = updates.title;
  if (updates.description !== undefined) updateData.description = updates.description;
  if (updates.subject) updateData.subject = updates.subject;
  if (updates.tutor_id) updateData.tutor_id = updates.tutor_id;
  if (updates.is_group !== undefined) updateData.is_group = updates.is_group;
  
  return updateData;
};

// Apply time updates to a specific lesson instance using duration-based approach
const applyTimeUpdatesToInstance = (instanceLesson: any, newStartTime: Date, newEndTime: Date) => {
  // Get the instance date (preserve the specific date of this instance)
  const instanceDate = new Date(instanceLesson.start_time);
  const lessonDuration = differenceInMinutes(newEndTime, newStartTime);
  
  // Extract the time components from the new times (in UK timezone)
  const ukStartTime = convertUTCToUK(newStartTime);
  const ukEndTime = convertUTCToUK(newEndTime);
  
  // Create new times for this instance date using UK timezone
  const instanceUKStartTime = createUKDateTime(instanceDate, 
    `${ukStartTime.getHours().toString().padStart(2, '0')}:${ukStartTime.getMinutes().toString().padStart(2, '0')}`
  );
  const instanceUKEndTime = createUKDateTime(instanceDate,
    `${ukEndTime.getHours().toString().padStart(2, '0')}:${ukEndTime.getMinutes().toString().padStart(2, '0')}`
  );
  
  // Convert back to UTC for storage
  const instanceStartTime = convertUKToUTC(instanceUKStartTime);
  const instanceEndTime = convertUKToUTC(instanceUKEndTime);
  
  return {
    start_time: instanceStartTime.toISOString(),
    end_time: instanceEndTime.toISOString()
  };
};

export const updateAllFutureLessons = async (
  lessonId: string, 
  updates: LessonUpdate, 
  fromDate?: string
): Promise<number> => {
  console.log('Starting updateAllFutureLessons with updates:', updates);
  
  try {
    // Get the original lesson details
    const { data: originalLesson, error: fetchError } = await supabase
      .from('lessons')
      .select('*')
      .eq('id', lessonId)
      .single();

    if (fetchError || !originalLesson) {
      throw new Error('Failed to fetch original lesson details');
    }

    // Determine the date to start updates from - use actual datetime to ensure current lesson is included
    const startDate = fromDate ? parseISO(fromDate) : new Date();
    
    // Create base update data (non-time fields)
    const baseUpdateData = createUpdateData(updates);
    const hasTimeChanges = updates.start_time || updates.end_time;
    const tutorChanged = updates.tutor_id && updates.tutor_id !== originalLesson.tutor_id;

    // Find all future lessons to update - use gt with 1 second earlier to ensure current lesson is included
    const inclusiveStartDate = new Date(startDate.getTime() - 1000); // 1 second earlier
    const { data: futureLessons, error: queryError } = await supabase
      .from('lessons')
      .select('*')
      .eq('parent_lesson_id', originalLesson.parent_lesson_id || lessonId)
      .gte('start_time', inclusiveStartDate.toISOString())
      .order('start_time', { ascending: true });

    if (queryError) {
      throw new Error(`Failed to fetch future lessons: ${queryError.message}`);
    }

    if (!futureLessons || futureLessons.length === 0) {
      console.log('No future lessons found to update');
      return 0;
    }

    console.log(`Found ${futureLessons.length} future lessons to update`);

    let updatedCount = 0;
    const batchSize = 10;
    
    // Process lessons in batches
    for (let i = 0; i < futureLessons.length; i += batchSize) {
      const batch = futureLessons.slice(i, i + batchSize);
      
      // Process each lesson in the batch
      for (const lesson of batch) {
        let updateData = { ...baseUpdateData };
        
        // Apply time changes if needed (using duration-based approach like working code)
        if (hasTimeChanges) {
          const timeUpdates = applyTimeUpdatesToInstance(
            lesson,
            new Date(updates.start_time!),
            new Date(updates.end_time!)
          );
          updateData = { ...updateData, ...timeUpdates };
        }

        // Update the lesson
        const { error: updateError } = await supabase
          .from('lessons')
          .update(updateData)
          .eq('id', lesson.id);

        if (updateError) {
          console.error(`Failed to update lesson ${lesson.id}:`, updateError);
          throw new Error(`Failed to update lesson: ${updateError.message}`);
        }

        updatedCount++;
      }
    }

    // Update student associations if students changed
    if (updates.student_ids || updates.selectedStudents) {
      const studentIds = updates.student_ids || updates.selectedStudents || [];
      console.log('Updating student associations for future lessons');
      
      // Remove existing student associations for future lessons
      const { error: deleteError } = await supabase
        .from('lesson_students')
        .delete()
        .in('lesson_id', futureLessons.map(l => l.id));

      if (deleteError) {
        console.error('Failed to delete existing student associations:', deleteError);
      }

      // Add new student associations
      if (studentIds.length > 0) {
        const newAssociations = [];
        for (const lesson of futureLessons) {
          for (const studentId of studentIds) {
            newAssociations.push({
              lesson_id: lesson.id,
              student_id: studentId
            });
          }
        }

        const { error: insertError } = await supabase
          .from('lesson_students')
          .insert(newAssociations);

        if (insertError) {
          console.error('Failed to create new student associations:', insertError);
          throw new Error(`Failed to update student associations: ${insertError.message}`);
        }
      }
    }

    // Recreate LessonSpace rooms if tutor changed
    if (tutorChanged) {
      console.log('Tutor changed, recreating LessonSpace rooms for future lessons');
      
      for (const lesson of futureLessons) {
        try {
          await recreateLessonSpaceRoom(lesson.id);
          console.log(`Recreated LessonSpace room for lesson ${lesson.id}`);
        } catch (roomError) {
          console.error(`Failed to recreate room for lesson ${lesson.id}:`, roomError);
          // Continue with other lessons even if one fails
        }
      }
    }

    console.log(`Successfully updated ${updatedCount} future lessons`);
    return updatedCount;

  } catch (error) {
    console.error('Error in updateAllFutureLessons:', error);
    throw error;
  }
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