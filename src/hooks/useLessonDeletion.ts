
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useLessonDeletion = () => {
  const deleteLesson = async (lessonId: string) => {
    try {
      console.log('🗑️ Starting lesson deletion for ID:', lessonId);

      // Check if lesson exists and get details
      const { data: lesson, error: fetchError } = await supabase
        .from('lessons')
        .select('*')
        .eq('id', lessonId)
        .single();

      if (fetchError) {
        console.error('❌ Error fetching lesson:', fetchError);
        throw new Error('Lesson not found');
      }

      console.log('📋 Found lesson to delete:', lesson.title);

      // Delete related records in the correct order to avoid foreign key constraints
      
      // 1. Delete homework submissions first (get homework IDs first)
      const { data: homeworkIds } = await supabase
        .from('homework')
        .select('id')
        .eq('lesson_id', lessonId);

      if (homeworkIds && homeworkIds.length > 0) {
        const homeworkIdArray = homeworkIds.map(h => h.id);
        
        const { error: submissionsError } = await supabase
          .from('homework_submissions')
          .delete()
          .in('homework_id', homeworkIdArray);

        if (submissionsError) {
          console.error('❌ Error deleting homework submissions:', submissionsError);
        } else {
          console.log('✅ Deleted homework submissions');
        }
      }

      // 2. Delete homework
      const { error: homeworkError } = await supabase
        .from('homework')
        .delete()
        .eq('lesson_id', lessonId);

      if (homeworkError) {
        console.error('❌ Error deleting homework:', homeworkError);
      } else {
        console.log('✅ Deleted homework');
      }

      // 3. Delete lesson attendance
      const { error: attendanceError } = await supabase
        .from('lesson_attendance')
        .delete()
        .eq('lesson_id', lessonId);

      if (attendanceError) {
        console.error('❌ Error deleting attendance:', attendanceError);
      } else {
        console.log('✅ Deleted attendance records');
      }

      // 4. Delete lesson plan assignments
      const { error: planAssignmentError } = await supabase
        .from('lesson_plan_assignments')
        .delete()
        .eq('lesson_id', lessonId);

      if (planAssignmentError) {
        console.error('❌ Error deleting lesson plan assignments:', planAssignmentError);
      } else {
        console.log('✅ Deleted lesson plan assignments');
      }

      // 5. Delete whiteboard files
      const { error: whiteboardError } = await supabase
        .from('whiteboard_files')
        .delete()
        .eq('lesson_id', lessonId);

      if (whiteboardError) {
        console.error('❌ Error deleting whiteboard files:', whiteboardError);
      } else {
        console.log('✅ Deleted whiteboard files');
      }

      // 6. Delete lesson students
      const { error: studentsError } = await supabase
        .from('lesson_students')
        .delete()
        .eq('lesson_id', lessonId);

      if (studentsError) {
        console.error('❌ Error deleting lesson students:', studentsError);
      } else {
        console.log('✅ Deleted lesson students');
      }

      // 7. Delete recurring lesson groups (if this is the original lesson)
      const { error: recurringError } = await supabase
        .from('recurring_lesson_groups')
        .delete()
        .eq('original_lesson_id', lessonId);

      if (recurringError) {
        console.error('❌ Error deleting recurring groups:', recurringError);
      } else {
        console.log('✅ Deleted recurring lesson groups');
      }

      // 8. Finally delete the lesson itself
      const { error: lessonError } = await supabase
        .from('lessons')
        .delete()
        .eq('id', lessonId);

      if (lessonError) {
        console.error('❌ Error deleting lesson:', lessonError);
        throw lessonError;
      }

      console.log('✅ Successfully deleted lesson and all related data');
      toast.success('Lesson deleted successfully');
      
      return true;
    } catch (error: any) {
      console.error('❌ Failed to delete lesson:', error);
      toast.error(`Failed to delete lesson: ${error.message}`);
      throw error;
    }
  };

  const deleteLessonWithConfirmation = async (lessonId: string, lessonTitle: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete the lesson "${lessonTitle}"? This action cannot be undone and will also delete all related homework, attendance records, and other associated data.`
    );

    if (confirmed) {
      return await deleteLesson(lessonId);
    }
    
    return false;
  };

  return {
    deleteLesson,
    deleteLessonWithConfirmation
  };
};
