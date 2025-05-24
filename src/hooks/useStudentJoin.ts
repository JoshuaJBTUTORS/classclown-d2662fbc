
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useStudentJoin = () => {
  const [isJoining, setIsJoining] = useState(false);

  const joinLessonSpace = async (lessonId: string, studentId: number, studentName: string): Promise<string | null> => {
    setIsJoining(true);
    try {
      console.log("Student joining lesson space...", { lessonId, studentId, studentName });
      
      const { data: result, error } = await supabase.functions.invoke('lesson-space-integration', {
        body: {
          action: 'join-space',
          lessonId,
          studentId,
          studentName
        }
      });

      if (error) {
        console.error("Function invocation error:", error);
        throw error;
      }

      if (!result?.success) {
        throw new Error(result?.error || 'Failed to join lesson space');
      }

      console.log("Successfully joined lesson space:", result);
      return result.studentUrl;
    } catch (error) {
      console.error('Error joining lesson space:', error);
      toast.error(`Failed to join lesson: ${error.message}`);
      return null;
    } finally {
      setIsJoining(false);
    }
  };

  return {
    joinLessonSpace,
    isJoining
  };
};
