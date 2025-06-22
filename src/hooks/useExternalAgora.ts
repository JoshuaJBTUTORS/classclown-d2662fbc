
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useExternalAgora = () => {
  const [isLoading, setIsLoading] = useState(false);

  const createExternalAgoraRoom = async (lessonId: string, userId: string, userRole: 'tutor' | 'student') => {
    setIsLoading(true);
    try {
      console.log('Creating External Agora room for lesson:', lessonId);

      // Call the agora-integration edge function to create Flexible Classroom session
      const { data, error } = await supabase.functions.invoke('agora-integration', {
        body: {
          action: 'create_flexible_classroom',
          lessonId: lessonId,
          userId: userId,
          userRole: userRole
        }
      });

      if (error) {
        console.error('Error creating Flexible Classroom:', error);
        throw error;
      }

      if (!data || !data.success) {
        throw new Error(data?.error || 'Failed to create Flexible Classroom session');
      }

      console.log('External Agora room created successfully:', data);

      // Update lesson with Flexible Classroom data only - removed old video conference fields
      const { error: updateError } = await supabase
        .from('lessons')
        .update({
          flexible_classroom_room_id: data.roomId,
          flexible_classroom_session_data: data
        })
        .eq('id', lessonId);

      if (updateError) {
        console.error('Error updating lesson with Flexible Classroom data:', updateError);
        throw updateError;
      }

      return data;
    } catch (error: any) {
      console.error('Error in createExternalAgoraRoom:', error);
      toast.error(error.message || 'Failed to create video room');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createExternalAgoraRoom,
    isLoading
  };
};
