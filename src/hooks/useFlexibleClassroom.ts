
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface FlexibleClassroomCredentials {
  roomId: string;
  userUuid: string;
  userName: string;
  userRole: 'teacher' | 'student';
  rtmToken: string;
  appId: string;
  lessonTitle?: string;
}

export const useFlexibleClassroom = () => {
  const [isLoading, setIsLoading] = useState(false);

  const createClassroomSession = async (
    lessonId: string,
    userRole: 'tutor' | 'student',
    customUID?: number,
    displayName?: string
  ): Promise<FlexibleClassroomCredentials | null> => {
    setIsLoading(true);
    try {
      console.log('Creating Flexible Classroom session:', { lessonId, userRole, customUID, displayName });
      
      const { data, error } = await supabase.functions.invoke('agora-integration', {
        body: {
          action: 'create-flexible-classroom',
          lessonId,
          userRole: userRole === 'tutor' ? 'tutor' : 'student',
          customUID,
          displayName
        }
      });

      if (error) {
        console.error('Error creating Flexible Classroom session:', error);
        toast.error('Failed to create classroom session');
        return null;
      }

      if (data?.success) {
        console.log('Flexible Classroom session created:', data);
        return {
          roomId: data.roomId,
          userUuid: data.userUuid,
          userName: displayName || data.userName,
          userRole: data.userRole,
          rtmToken: data.rtmToken,
          appId: data.appId,
          lessonTitle: data.lessonTitle
        };
      } else {
        console.error('Failed to create Flexible Classroom session:', data);
        toast.error('Failed to create classroom session');
        return null;
      }
    } catch (error) {
      console.error('Error creating Flexible Classroom session:', error);
      toast.error('Failed to create classroom session');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createClassroomSession,
    isLoading
  };
};
