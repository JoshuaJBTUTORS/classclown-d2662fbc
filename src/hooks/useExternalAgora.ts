
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CreateExternalRoomData {
  lessonId: string;
  title: string;
  startTime: string;
  duration?: number;
}

interface ExternalRoomData {
  roomUrl: string;
  channelName: string;
}

export const useExternalAgora = () => {
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);

  const createExternalRoom = async (data: CreateExternalRoomData): Promise<ExternalRoomData | null> => {
    setIsCreatingRoom(true);
    try {
      console.log("Creating external Agora room...", data);
      
      // Generate the external URL with lesson parameters
      const baseUrl = 'https://79272686d727c17955f1.vercel.app/';
      const channelName = `lesson_${data.lessonId}`;
      const roomUrl = `${baseUrl}?roomId=${data.lessonId}&channelName=${encodeURIComponent(channelName)}&lessonTitle=${encodeURIComponent(data.title)}`;
      
      // Update the lesson with external Agora room details
      const { error } = await supabase
        .from('lessons')
        .update({
          video_conference_provider: 'agora',
          video_conference_link: roomUrl,
          agora_channel_name: channelName
        })
        .eq('id', data.lessonId);

      if (error) {
        console.error("Error updating lesson with external Agora room:", error);
        throw error;
      }

      console.log("External Agora room created successfully:", { roomUrl, channelName });
      toast.success('External Agora room created successfully!');
      
      return {
        roomUrl,
        channelName
      };
    } catch (error) {
      console.error('Error creating external Agora room:', error);
      toast.error(`Failed to create external Agora room: ${error.message}`);
      return null;
    } finally {
      setIsCreatingRoom(false);
    }
  };

  return {
    createExternalRoom,
    isCreatingRoom
  };
};
