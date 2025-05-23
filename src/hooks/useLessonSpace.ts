
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CreateRoomData {
  lessonId: string;
  title: string;
  startTime: string;
  duration?: number;
}

interface RoomData {
  roomId: string;
  roomUrl: string;
  ownerUrl?: string;
}

export const useLessonSpace = () => {
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [isDeletingRoom, setIsDeletingRoom] = useState(false);

  const createRoom = async (data: CreateRoomData): Promise<RoomData | null> => {
    setIsCreatingRoom(true);
    try {
      console.log("Creating Lesson Space room...", data);
      
      const { data: result, error } = await supabase.functions.invoke('lesson-space-integration', {
        body: {
          action: 'create-room',
          ...data
        }
      });

      if (error) {
        console.error("Function invocation error:", error);
        throw error;
      }

      if (!result?.success) {
        throw new Error(result?.error || 'Failed to create room');
      }

      console.log("Room created successfully:", result);
      toast.success('Online lesson room created successfully!');
      
      return {
        roomId: result.roomId,
        roomUrl: result.roomUrl,
        ownerUrl: result.ownerUrl
      };
    } catch (error) {
      console.error('Error creating room:', error);
      toast.error(`Failed to create online lesson room: ${error.message}`);
      return null;
    } finally {
      setIsCreatingRoom(false);
    }
  };

  const deleteRoom = async (roomId: string): Promise<boolean> => {
    setIsDeletingRoom(true);
    try {
      console.log("Deleting Lesson Space room:", roomId);
      
      const { data: result, error } = await supabase.functions.invoke('lesson-space-integration', {
        body: {
          action: 'delete-room',
          roomId
        }
      });

      if (error) {
        console.error("Function invocation error:", error);
        throw error;
      }

      if (!result?.success) {
        throw new Error(result?.error || 'Failed to delete room');
      }

      console.log("Room deleted successfully");
      toast.success('Online lesson room deleted successfully!');
      return true;
    } catch (error) {
      console.error('Error deleting room:', error);
      toast.error(`Failed to delete online lesson room: ${error.message}`);
      return false;
    } finally {
      setIsDeletingRoom(false);
    }
  };

  const updateLesson = async (lessonId: string, roomData: Partial<RoomData> & { provider?: string }): Promise<boolean> => {
    try {
      const { data: result, error } = await supabase.functions.invoke('lesson-space-integration', {
        body: {
          action: 'update-lesson',
          lessonId,
          roomId: roomData.roomId,
          roomUrl: roomData.roomUrl,
          provider: roomData.provider
        }
      });

      if (error || !result?.success) {
        throw new Error(result?.error || 'Failed to update lesson');
      }

      return true;
    } catch (error) {
      console.error('Error updating lesson:', error);
      toast.error(`Failed to update lesson with room details: ${error.message}`);
      return false;
    }
  };

  return {
    createRoom,
    deleteRoom,
    updateLesson,
    isCreatingRoom,
    isDeletingRoom
  };
};
