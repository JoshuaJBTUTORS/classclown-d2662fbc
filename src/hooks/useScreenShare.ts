
import { useState, useRef } from 'react';
import AgoraRTC from 'agora-rtc-sdk-ng';
import { toast } from 'sonner';

export const useScreenShare = () => {
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isScreenShareLoading, setIsScreenShareLoading] = useState(false);
  const screenTrackRef = useRef<any>(null);
  const screenAudioTrackRef = useRef<any>(null);

  const startScreenShare = async () => {
    if (isScreenSharing || isScreenShareLoading) return;

    setIsScreenShareLoading(true);
    try {
      console.log('🖥️ Starting screen share...');

      // Create screen sharing track with audio on supported browsers
      const screenTracks = await AgoraRTC.createScreenVideoTrack({
        encoderConfig: "1080p_1",
        optimizationMode: "detail"
      }, "enable");

      // Handle both single track and array of tracks (with audio)
      if (Array.isArray(screenTracks)) {
        // Chrome 74+ with audio support
        const [screenVideoTrack, screenAudioTrack] = screenTracks;
        screenTrackRef.current = screenVideoTrack;
        screenAudioTrackRef.current = screenAudioTrack;
        
        console.log('✅ Screen share with audio created');
        toast.success('Screen sharing started with audio');
      } else {
        // Single video track
        screenTrackRef.current = screenTracks;
        console.log('✅ Screen share created (video only)');
        toast.success('Screen sharing started');
      }

      // Listen for screen share end event
      screenTrackRef.current.on('track-ended', () => {
        console.log('🛑 Screen share ended by user');
        stopScreenShare();
      });

      setIsScreenSharing(true);
      return {
        screenVideoTrack: screenTrackRef.current,
        screenAudioTrack: screenAudioTrackRef.current
      };

    } catch (error: any) {
      console.error('❌ Error starting screen share:', error);
      
      if (error.code === 'PERMISSION_DENIED') {
        toast.error('Screen sharing permission denied');
      } else if (error.code === 'NOT_SUPPORTED') {
        toast.error('Screen sharing not supported on this browser');
      } else {
        toast.error('Failed to start screen sharing');
      }
      
      setIsScreenSharing(false);
      return null;
    } finally {
      setIsScreenShareLoading(false);
    }
  };

  const stopScreenShare = async () => {
    if (!screenTrackRef.current) return;

    try {
      console.log('🛑 Stopping screen share...');
      
      // Close video track
      if (screenTrackRef.current) {
        screenTrackRef.current.close();
        screenTrackRef.current = null;
      }
      
      // Close audio track if it exists
      if (screenAudioTrackRef.current) {
        screenAudioTrackRef.current.close();
        screenAudioTrackRef.current = null;
      }

      setIsScreenSharing(false);
      toast.success('Screen sharing stopped');
      
      console.log('✅ Screen share stopped');
      
      return true;
    } catch (error) {
      console.error('❌ Error stopping screen share:', error);
      toast.error('Error stopping screen share');
      return false;
    }
  };

  const getScreenTracks = () => {
    return {
      screenVideoTrack: screenTrackRef.current,
      screenAudioTrack: screenAudioTrackRef.current
    };
  };

  return {
    isScreenSharing,
    isScreenShareLoading,
    startScreenShare,
    stopScreenShare,
    getScreenTracks
  };
};
