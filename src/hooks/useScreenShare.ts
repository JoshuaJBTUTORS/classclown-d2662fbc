import { useState, useEffect, useCallback } from 'react';
import AgoraRTC from 'agora-rtc-sdk-ng';
import { toast } from 'sonner';

interface UseScreenShareProps {
  client: AgoraRTC.IAgoraRTCClient | null;
}

export const useScreenShare = ({ client: agoraClient }: UseScreenShareProps) => {
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [screenTrack, setScreenTrack] = useState<AgoraRTC.ILocalVideoTrack | null>(null);

  const stopScreenShare = useCallback(async () => {
    if (!agoraClient || !isScreenSharing || !screenTrack) return;

    try {
      setIsScreenSharing(false);
      await agoraClient.unpublish(screenTrack);
      screenTrack.close();
      setScreenTrack(null);
      console.log('Screen sharing stopped');
      toast.info('Screen sharing stopped');
    } catch (error) {
      console.error('Failed to stop screen sharing:', error);
      toast.error('Failed to stop screen sharing');
    }
  }, [agoraClient, isScreenSharing, screenTrack]);

  useEffect(() => {
    // Ensure screen sharing is stopped when the component unmounts or client changes
    return () => {
      if (isScreenSharing && screenTrack) {
        stopScreenShare();
      }
    };
  }, [isScreenSharing, screenTrack, stopScreenShare]);

  const startScreenShare = useCallback(async () => {
    if (!agoraClient || isScreenSharing) return;

    try {
      setIsScreenSharing(true);
      
      // Create screen video track using the correct method
      const screenTrack = await agoraClient.createScreenVideoTrack({
        encoderConfig: "1080p_1",
        optimizationMode: "detail"
      });

      setScreenTrack(screenTrack);

      // Publish the screen track
      await agoraClient.publish(screenTrack);
      
      console.log('Screen sharing started');
      toast.success('Screen sharing started');

      // Listen for screen share end (when user stops sharing)
      screenTrack.on("track-ended", () => {
        stopScreenShare();
        toast.info('Screen sharing ended');
      });

    } catch (error: any) {
      console.error('Failed to start screen sharing:', error);
      setIsScreenSharing(false);
      
      // Handle specific error cases
      if (error.code === 'PERMISSION_DENIED') {
        toast.error('Screen sharing permission denied');
      } else if (error.code === 'NOT_SUPPORTED') {
        toast.error('Screen sharing not supported in this browser');
      } else {
        toast.error('Failed to start screen sharing');
      }
    }
  }, [agoraClient, isScreenSharing]);

  return {
    isScreenSharing,
    startScreenShare,
    stopScreenShare,
  };
};
