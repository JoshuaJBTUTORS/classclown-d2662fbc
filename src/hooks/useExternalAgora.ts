
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ExternalAgoraCredentials {
  rtcToken: string;
  rtmToken: string;
  channelName: string;
  uid: number;
  appId: string;
  expireTime: number;
  role: 'publisher' | 'subscriber';
}

interface CreateExternalRoomParams {
  lessonId: string;
  title: string;
  startTime: string;
  duration: number;
}

export const useExternalAgora = () => {
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [isGeneratingTokens, setIsGeneratingTokens] = useState(false);

  const createRoom = async (params: CreateExternalRoomParams): Promise<ExternalAgoraCredentials | null> => {
    setIsCreatingRoom(true);
    try {
      console.log('Creating external Agora room for lesson:', params.lessonId);
      
      // Generate channel name based on lesson ID
      const channelName = `lesson_${params.lessonId.replace(/-/g, '_')}`;
      const uid = Math.floor(Math.random() * 1000000) + 1000; // Generate random UID

      // Call our edge function to generate tokens
      const { data, error } = await supabase.functions.invoke('generate-agora-token', {
        body: {
          channelName,
          uid,
          userRole: 'tutor' // Creator gets publisher privileges
        }
      });

      if (error) {
        console.error('Error generating Agora tokens:', error);
        toast.error('Failed to create online room');
        return null;
      }

      if (data?.success) {
        console.log('External Agora tokens generated:', {
          channelName: data.channelName,
          uid: data.uid,
          appId: data.appId?.substring(0, 8) + '...',
          hasRtcToken: !!data.rtcToken,
          hasRtmToken: !!data.rtmToken
        });

        // Update lesson with Agora credentials
        const { error: updateError } = await supabase
          .from('lessons')
          .update({
            video_conference_provider: 'agora',
            agora_channel_name: data.channelName,
            agora_token: data.rtcToken,
            agora_uid: data.uid,
            agora_rtm_token: data.rtmToken
          })
          .eq('id', params.lessonId);

        if (updateError) {
          console.error('Error updating lesson with Agora data:', updateError);
          toast.error('Failed to save room configuration');
          return null;
        }

        toast.success('Online room created successfully!');
        
        return {
          rtcToken: data.rtcToken,
          rtmToken: data.rtmToken,
          channelName: data.channelName,
          uid: data.uid,
          appId: data.appId,
          expireTime: data.expireTime,
          role: data.role
        };
      } else {
        console.error('Token generation failed:', data);
        toast.error('Failed to create online room');
        return null;
      }
    } catch (error) {
      console.error('Error creating external Agora room:', error);
      toast.error('Failed to create online room');
      return null;
    } finally {
      setIsCreatingRoom(false);
    }
  };

  const getTokens = async (lessonId: string, userRole: 'tutor' | 'student' | 'parent' = 'student'): Promise<ExternalAgoraCredentials | null> => {
    setIsGeneratingTokens(true);
    try {
      console.log('Getting external Agora tokens for lesson:', lessonId, 'role:', userRole);
      
      // First, get lesson data to see if Agora room exists
      const { data: lesson, error: lessonError } = await supabase
        .from('lessons')
        .select('id, agora_channel_name, video_conference_provider')
        .eq('id', lessonId)
        .single();

      if (lessonError || !lesson) {
        console.error('Error fetching lesson:', lessonError);
        toast.error('Lesson not found');
        return null;
      }

      if (lesson.video_conference_provider !== 'agora' || !lesson.agora_channel_name) {
        console.error('Lesson does not have Agora room configured');
        toast.error('No video room configured for this lesson');
        return null;
      }

      // Generate new tokens for the user
      const uid = Math.floor(Math.random() * 1000000) + 1000; // Generate unique UID
      
      const { data, error } = await supabase.functions.invoke('generate-agora-token', {
        body: {
          channelName: lesson.agora_channel_name,
          uid,
          userRole: userRole === 'parent' ? 'student' : userRole
        }
      });

      if (error) {
        console.error('Error generating tokens:', error);
        toast.error('Failed to get room access');
        return null;
      }

      if (data?.success) {
        console.log('External Agora tokens retrieved:', {
          channelName: data.channelName,
          uid: data.uid,
          role: data.role
        });

        return {
          rtcToken: data.rtcToken,
          rtmToken: data.rtmToken,
          channelName: data.channelName,
          uid: data.uid,
          appId: data.appId,
          expireTime: data.expireTime,
          role: data.role
        };
      } else {
        console.error('Token generation failed:', data);
        toast.error('Failed to get room access');
        return null;
      }
    } catch (error) {
      console.error('Error getting external Agora tokens:', error);
      toast.error('Failed to get room access');
      return null;
    } finally {
      setIsGeneratingTokens(false);
    }
  };

  const generateExternalAgoraUrl = (credentials: ExternalAgoraCredentials, lessonTitle: string): string => {
    // This is where you would construct the URL to your external Vercel Agora app
    // Replace this with your actual Vercel app URL
    const baseUrl = 'https://your-agora-app.vercel.app'; // Replace with your actual URL
    
    const params = new URLSearchParams({
      appId: credentials.appId,
      channelName: credentials.channelName,
      token: credentials.rtcToken,
      rtmToken: credentials.rtmToken,
      uid: credentials.uid.toString(),
      role: credentials.role,
      lessonTitle: encodeURIComponent(lessonTitle)
    });

    return `${baseUrl}?${params.toString()}`;
  };

  return {
    createRoom,
    getTokens,
    generateExternalAgoraUrl,
    isCreatingRoom,
    isGeneratingTokens
  };
};
