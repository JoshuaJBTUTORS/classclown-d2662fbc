
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { NetlessService } from '@/services/netlessService';
import { toast } from 'sonner';

interface NetlessCredentials {
  roomUuid: string;
  roomToken: string;
  appIdentifier: string;
}

export const useNetlessCredentials = (lessonId: string, userRole: 'tutor' | 'student') => {
  const [credentials, setCredentials] = useState<NetlessCredentials | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCredentials();
  }, [lessonId, userRole]);

  const loadCredentials = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch lesson data to get existing Netless credentials
      const { data: lessonData, error: lessonError } = await supabase
        .from('lessons')
        .select('netless_room_uuid, netless_room_token, netless_app_identifier')
        .eq('id', lessonId)
        .single();

      if (lessonError) {
        throw new Error('Failed to fetch lesson data');
      }

      // Check if we have all required credentials
      if (lessonData.netless_room_uuid && lessonData.netless_app_identifier) {
        // If we have room UUID and app identifier but missing token, generate a new one
        if (!lessonData.netless_room_token) {
          console.log('Missing room token, generating new one...');
          await generateMissingToken(lessonData.netless_room_uuid, lessonData.netless_app_identifier);
        } else {
          // We have all credentials
          setCredentials({
            roomUuid: lessonData.netless_room_uuid,
            roomToken: lessonData.netless_room_token,
            appIdentifier: lessonData.netless_app_identifier
          });
        }
      } else {
        // Missing critical credentials
        setError('Whiteboard not configured for this lesson');
      }
    } catch (err) {
      console.error('Error loading Netless credentials:', err);
      setError(err instanceof Error ? err.message : 'Failed to load whiteboard configuration');
    } finally {
      setIsLoading(false);
    }
  };

  const generateMissingToken = async (roomUuid: string, appIdentifier: string) => {
    try {
      // Get the Netless SDK token from environment
      const { data: { NETLESS_SDK_TOKEN }, error: secretError } = await supabase.functions.invoke('get-netless-token');
      
      if (secretError || !NETLESS_SDK_TOKEN) {
        throw new Error('Netless SDK token not configured');
      }

      // Generate new room token
      const roomToken = await NetlessService.ensureRoomToken(NETLESS_SDK_TOKEN, roomUuid, userRole);

      // Update the lesson with the new token
      const { error: updateError } = await supabase
        .from('lessons')
        .update({ netless_room_token: roomToken })
        .eq('id', lessonId);

      if (updateError) {
        throw new Error('Failed to save whiteboard token');
      }

      setCredentials({
        roomUuid,
        roomToken,
        appIdentifier
      });

      toast.success('Whiteboard configured successfully');
    } catch (err) {
      console.error('Error generating room token:', err);
      throw err;
    }
  };

  const regenerateToken = async () => {
    if (!credentials) return;

    try {
      await generateMissingToken(credentials.roomUuid, credentials.appIdentifier);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to regenerate whiteboard token');
    }
  };

  return {
    credentials,
    isLoading,
    error,
    regenerateToken
  };
};
