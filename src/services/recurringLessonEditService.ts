
import { supabase } from '@/integrations/supabase/client';

interface EditRecurringLessonsData {
  title: string;
  description?: string;
  tutorId: string;
  startTime: string;
  endTime: string;
  subject?: string;
  studentIds: number[];
}

export const editRecurringLessonSeries = async (
  originalLessonId: string,
  editScope: 'this_only' | 'this_and_future' | 'all_occurrences',
  editData: EditRecurringLessonsData
) => {
  try {
    console.log('Starting recurring lesson edit:', { originalLessonId, editScope, editData });

    // Get the original lesson details
    const { data: originalLesson, error: originalError } = await supabase
      .from('lessons')
      .select(`
        *,
        lesson_students(student_id)
      `)
      .eq('id', originalLessonId)
      .single();

    if (originalError || !originalLesson) {
      throw new Error('Failed to fetch original lesson');
    }

    const originalStudentIds = originalLesson.lesson_students?.map(ls => ls.student_id) || [];
    const newStudentIds = editData.studentIds || [];
    const addedStudentIds = newStudentIds.filter(id => !originalStudentIds.includes(id));
    const removedStudentIds = originalStudentIds.filter(id => !newStudentIds.includes(id));
    const tutorChanged = originalLesson.tutor_id !== editData.tutorId;

    let lessonsToUpdate: string[] = [];

    // Determine which lessons to update based on edit scope
    if (editScope === 'this_only') {
      lessonsToUpdate = [originalLessonId];
    } else {
      // Find all related lessons
      const { data: relatedLessons, error: relatedError } = await supabase
        .from('lessons')
        .select('id, start_time')
        .or(`id.eq.${originalLessonId},parent_lesson_id.eq.${originalLessonId}`);

      if (relatedError) {
        throw new Error('Failed to fetch related lessons');
      }

      if (editScope === 'this_and_future') {
        // Filter lessons from this date onwards
        const currentLessonStartTime = new Date(originalLesson.start_time);
        lessonsToUpdate = relatedLessons
          ?.filter(lesson => new Date(lesson.start_time) >= currentLessonStartTime)
          .map(lesson => lesson.id) || [];
      } else if (editScope === 'all_occurrences') {
        lessonsToUpdate = relatedLessons?.map(lesson => lesson.id) || [];
      }
    }

    console.log(`Updating ${lessonsToUpdate.length} lessons`);

    // Update lessons
    for (const lessonId of lessonsToUpdate) {
      const { error: updateError } = await supabase
        .from('lessons')
        .update({
          title: editData.title,
          description: editData.description,
          tutor_id: editData.tutorId,
          start_time: editData.startTime,
          end_time: editData.endTime,
          subject: editData.subject,
          updated_at: new Date().toISOString()
        })
        .eq('id', lessonId);

      if (updateError) {
        console.error(`Failed to update lesson ${lessonId}:`, updateError);
        throw new Error(`Failed to update lesson: ${updateError.message}`);
      }

      // Handle student changes
      if (addedStudentIds.length > 0 || removedStudentIds.length > 0) {
        // Remove students that are no longer in the lesson
        if (removedStudentIds.length > 0) {
          const { error: removeError } = await supabase
            .from('lesson_students')
            .delete()
            .eq('lesson_id', lessonId)
            .in('student_id', removedStudentIds);

          if (removeError) {
            console.error(`Failed to remove students from lesson ${lessonId}:`, removeError);
          }
        }

        // Add new students
        if (addedStudentIds.length > 0) {
          const newLessonStudents = addedStudentIds.map(studentId => ({
            lesson_id: lessonId,
            student_id: studentId
          }));

          const { error: addError } = await supabase
            .from('lesson_students')
            .insert(newLessonStudents);

          if (addError) {
            console.error(`Failed to add students to lesson ${lessonId}:`, addError);
          }
        }

        // If there's a video room, add new students to it
        const { data: lessonWithRoom, error: roomError } = await supabase
          .from('lessons')
          .select('lesson_space_room_id, lesson_space_space_id')
          .eq('id', lessonId)
          .single();

        if (!roomError && lessonWithRoom?.lesson_space_space_id && addedStudentIds.length > 0) {
          try {
            console.log(`Adding ${addedStudentIds.length} students to video room for lesson ${lessonId}`);
            
            const { data: result, error: addStudentsError } = await supabase.functions.invoke('lesson-space-integration', {
              body: {
                action: 'add-students-to-room',
                lessonId: lessonId,
                newStudentIds: addedStudentIds
              }
            });

            if (addStudentsError) {
              console.error('Error adding students to video room:', addStudentsError);
            } else {
              console.log(`✅ Successfully added students to video room: ${result?.newStudentUrlsCreated || 0} URLs created`);
            }
          } catch (error) {
            console.error('Error invoking add-students-to-room:', error);
          }
        }
      }

      // Handle tutor changes - generate new tutor URL if needed
      if (tutorChanged) {
        const { data: lessonWithRoom, error: roomError } = await supabase
          .from('lessons')
          .select('lesson_space_room_id, lesson_space_space_id')
          .eq('id', lessonId)
          .single();

        if (!roomError && lessonWithRoom?.lesson_space_space_id) {
          try {
            console.log(`Generating new tutor URL for lesson ${lessonId} with new tutor ${editData.tutorId}`);
            
            const { data: result, error: generateTutorError } = await supabase.functions.invoke('lesson-space-integration', {
              body: {
                action: 'generate-tutor-url',
                lessonId: lessonId,
                tutorId: editData.tutorId
              }
            });

            if (generateTutorError) {
              console.error('Error generating new tutor URL:', generateTutorError);
            } else {
              console.log(`✅ Successfully generated new tutor URL for lesson ${lessonId}`);
              
              // Also remove the old tutor's URL
              const { error: deleteOldUrlError } = await supabase
                .from('lesson_participant_urls')
                .delete()
                .eq('lesson_id', lessonId)
                .eq('participant_id', originalLesson.tutor_id)
                .eq('participant_type', 'tutor');

              if (deleteOldUrlError) {
                console.error('Error removing old tutor URL:', deleteOldUrlError);
              } else {
                console.log(`✅ Removed old tutor URL for lesson ${lessonId}`);
              }
            }
          } catch (error) {
            console.error('Error handling tutor URL update:', error);
          }
        }
      }
    }

    return {
      success: true,
      updatedLessons: lessonsToUpdate.length,
      message: `Successfully updated ${lessonsToUpdate.length} lesson(s)`
    };

  } catch (error) {
    console.error('Error in editRecurringLessonSeries:', error);
    throw error;
  }
};

export const deleteRecurringLessonSeries = async (
  originalLessonId: string,
  deleteScope: 'this_only' | 'this_and_future' | 'all_occurrences'
) => {
  try {
    console.log('Starting recurring lesson deletion:', { originalLessonId, deleteScope });

    // Get the original lesson details
    const { data: originalLesson, error: originalError } = await supabase
      .from('lessons')
      .select('id, start_time, parent_lesson_id')
      .eq('id', originalLessonId)
      .single();

    if (originalError || !originalLesson) {
      throw new Error('Failed to fetch original lesson');
    }

    let lessonsToDelete: string[] = [];

    // Determine which lessons to delete based on delete scope
    if (deleteScope === 'this_only') {
      lessonsToDelete = [originalLessonId];
    } else {
      // Find all related lessons
      const parentId = originalLesson.parent_lesson_id || originalLessonId;
      
      const { data: relatedLessons, error: relatedError } = await supabase
        .from('lessons')
        .select('id, start_time')
        .or(`id.eq.${parentId},parent_lesson_id.eq.${parentId}`);

      if (relatedError) {
        throw new Error('Failed to fetch related lessons');
      }

      if (deleteScope === 'this_and_future') {
        // Filter lessons from this date onwards
        const currentLessonStartTime = new Date(originalLesson.start_time);
        lessonsToDelete = relatedLessons
          ?.filter(lesson => new Date(lesson.start_time) >= currentLessonStartTime)
          .map(lesson => lesson.id) || [];
      } else if (deleteScope === 'all_occurrences') {
        lessonsToDelete = relatedLessons?.map(lesson => lesson.id) || [];
      }
    }

    console.log(`Deleting ${lessonsToDelete.length} lessons`);

    // Delete lessons and related data
    for (const lessonId of lessonsToDelete) {
      // Delete lesson students first
      await supabase
        .from('lesson_students')
        .delete()
        .eq('lesson_id', lessonId);

      // Delete lesson participant URLs
      await supabase
        .from('lesson_participant_urls')
        .delete()
        .eq('lesson_id', lessonId);

      // Delete homework
      await supabase
        .from('homework')
        .delete()
        .eq('lesson_id', lessonId);

      // Delete lesson attendance
      await supabase
        .from('lesson_attendance')
        .delete()
        .eq('lesson_id', lessonId);

      // Finally delete the lesson
      const { error: deleteError } = await supabase
        .from('lessons')
        .delete()
        .eq('id', lessonId);

      if (deleteError) {
        console.error(`Failed to delete lesson ${lessonId}:`, deleteError);
        throw new Error(`Failed to delete lesson: ${deleteError.message}`);
      }
    }

    return {
      success: true,
      deletedLessons: lessonsToDelete.length,
      message: `Successfully deleted ${lessonsToDelete.length} lesson(s)`
    };

  } catch (error) {
    console.error('Error in deleteRecurringLessonSeries:', error);
    throw error;
  }
};
