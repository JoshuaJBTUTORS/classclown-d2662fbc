
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AgoraRoomData {
  channelName: string;
  rtcToken: string;
  rtmToken: string;
  uid: number;
  appId: string;
  role?: 'publisher' | 'subscriber';
  netlessRoomUuid?: string;
  netlessRoomToken?: string;
  netlessAppIdentifier?: string;
}

interface CreateRoomParams {
  lessonId: string;
  title: string;
  startTime: string;
  duration: number;
}

export const useAgora = () => {
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [isGeneratingTokens, setIsGeneratingTokens] = useState(false);

  const createRoom = async (params: CreateRoomParams): Promise<AgoraRoomData | null> => {
    setIsCreatingRoom(true);
    try {
      const { data, error } = await supabase.functions.invoke('agora-integration', {
        body: {
          action: 'create-room',
          lessonId: params.lessonId,
          userRole: 'tutor'
        }
      });

      if (error) {
        console.error('Error creating Agora room:', error);
        toast.error('Failed to create online room');
        return null;
      }

      if (data.success) {
        toast.success('Online room created successfully!');
        return {
          channelName: data.channelName,
          rtcToken: data.rtcToken,
          rtmToken: data.rtmToken,
          uid: data.uid,
          appId: data.appId,
          netlessRoomUuid: data.netlessRoomUuid,
          netlessRoomToken: data.netlessRoomToken,
          netlessAppIdentifier: data.netlessAppIdentifier
        };
      } else {
        toast.error('Failed to create online room');
        return null;
      }
    } catch (error) {
      console.error('Error creating Agora room:', error);
      toast.error('Failed to create online room');
      return null;
    } finally {
      setIsCreatingRoom(false);
    }
  };

  const getTokens = async (lessonId: string, userRole: 'tutor' | 'student' | 'parent' = 'student'): Promise<AgoraRoomData | null> => {
    setIsGeneratingTokens(true);
    try {
      const { data, error } = await supabase.functions.invoke('agora-integration', {
        body: {
          action: 'get-tokens',
          lessonId,
          userRole: userRole === 'parent' ? 'student' : userRole
        }
      });

      if (error) {
        console.error('Error getting Agora tokens:', error);
        toast.error('Failed to get room access');
        return null;
      }

      if (data.success) {
        return {
          channelName: data.channelName,
          rtcToken: data.rtcToken,
          rtmToken: data.rtmToken,
          uid: data.uid,
          appId: data.appId,
          role: data.role,
          netlessRoomUuid: data.netlessRoomUuid,
          netlessRoomToken: data.netlessRoomToken,
          netlessAppIdentifier: data.netlessAppIdentifier
        };
      } else {
        toast.error('Failed to get room access');
        return null;
      }
    } catch (error) {
      console.error('Error getting Agora tokens:', error);
      toast.error('Failed to get room access');
      return null;
    } finally {
      setIsGeneratingTokens(false);
    }
  };

  const startRecording = async (lessonId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.functions.invoke('agora-integration', {
        body: {
          action: 'start_recording',
          lessonId
        }
      });

      if (error) {
        console.error('Error starting recording:', error);
        toast.error('Failed to start recording');
        return false;
      }

      if (data.success) {
        toast.success('Recording started');
        return true;
      } else {
        toast.error('Failed to start recording');
        return false;
      }
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Failed to start recording');
      return false;
    }
  };

  const stopRecording = async (lessonId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.functions.invoke('agora-integration', {
        body: {
          action: 'stop_recording',
          lessonId
        }
      });

      if (error) {
        console.error('Error stopping recording:', error);
        toast.error('Failed to stop recording');
        return false;
      }

      if (data.success) {
        toast.success('Recording stopped');
        return true;
      } else {
        toast.error('Failed to stop recording');
        return false;
      }
    } catch (error) {
      console.error('Error stopping recording:', error);
      toast.error('Failed to stop recording');
      return false;
    }
  };

  return {
    createRoom,
    getTokens,
    startRecording,
    stopRecording,
    isCreatingRoom,
    isGeneratingTokens
  };
};
