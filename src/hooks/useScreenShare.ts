
import { useState, useEffect, useCallback } from 'react';
import AgoraRTC, { IAgoraRTCClient, ILocalVideoTrack } from 'agora-rtc-sdk-ng';
import { toast } from 'sonner';

interface UseScreenShareProps {
  client: IAgoraRTCClient | null;
}

export const useScreenShare = ({ client: agoraClient }: UseScreenShareProps) => {
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isScreenShareLoading, setIsScreenShareLoading] = useState(false);
  const [isScreenSharePaused, setIsScreenSharePaused] = useState(false);
  const [screenTrack, setScreenTrack] = useState<ILocalVideoTrack | null>(null);

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
      setIsScreenShareLoading(true);
      setIsScreenSharing(true);
      
      // Create screen video track using the correct method
      const newScreenTrack = await AgoraRTC.createScreenVideoTrack({
        encoderConfig: "1080p_1",
        optimizationMode: "detail"
      });

      setScreenTrack(newScreenTrack);

      // Publish the screen track
      await agoraClient.publish(newScreenTrack);
      
      console.log('Screen sharing started');
      toast.success('Screen sharing started');

      // Listen for screen share end (when user stops sharing)
      newScreenTrack.on("track-ended", () => {
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
    } finally {
      setIsScreenShareLoading(false);
    }
  }, [agoraClient, isScreenSharing]);

  const getScreenTracks = useCallback(() => {
    return {
      screenVideoTrack: screenTrack,
      screenAudioTrack: null // For now, we don't handle audio track separately
    };
  }, [screenTrack]);

  const attemptScreenShareRecovery = useCallback(async () => {
    if (isScreenSharePaused) {
      setIsScreenSharePaused(false);
      // Try to resume screen sharing
      await startScreenShare();
    }
  }, [isScreenSharePaused, startScreenShare]);

  // Listen for visibility changes to detect tab switches
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isScreenSharing) {
        setIsScreenSharePaused(true);
      } else if (!document.hidden && isScreenSharePaused) {
        setIsScreenSharePaused(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isScreenSharing, isScreenSharePaused]);

  return {
    isScreenSharing,
    isScreenShareLoading,
    isScreenSharePaused,
    startScreenShare,
    stopScreenShare,
    getScreenTracks,
    attemptScreenShareRecovery,
  };
};
