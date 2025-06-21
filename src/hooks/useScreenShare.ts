
import { useState, useRef, useEffect } from 'react';
import AgoraRTC from 'agora-rtc-sdk-ng';
import { toast } from 'sonner';

export const useScreenShare = () => {
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isScreenShareLoading, setIsScreenShareLoading] = useState(false);
  const [isScreenSharePaused, setIsScreenSharePaused] = useState(false);
  const screenTrackRef = useRef<any>(null);
  const screenAudioTrackRef = useRef<any>(null);
  const screenShareIntentRef = useRef(false); // Track user's intent to screen share
  const isRecoveringRef = useRef(false);
  const hasAudioRef = useRef(false); // Track if current session has audio

  // Page Visibility API integration
  useEffect(() => {
    const handleVisibilityChange = async () => {
      console.log('🔄 Tab visibility changed:', document.visibilityState);
      
      if (document.hidden) {
        // Tab became hidden - mark as paused but don't stop
        if (isScreenSharing) {
          console.log('⏸️ Screen sharing paused due to tab switch');
          setIsScreenSharePaused(true);
        }
      } else {
        // Tab became visible - attempt recovery if needed
        if (screenShareIntentRef.current && !isRecoveringRef.current) {
          await attemptScreenShareRecovery();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isScreenSharing]);

  // Monitor track health
  const setupTrackEventListeners = (videoTrack: any, audioTrack?: any) => {
    const handleTrackEnded = async () => {
      console.log('🛑 Screen track ended - checking if intentional or browser suspension');
      
      // If we're not visible and track ended, it's likely browser suspension
      if (document.hidden && screenShareIntentRef.current) {
        console.log('📱 Track ended due to tab switch - will recover when tab is active');
        setIsScreenSharePaused(true);
        return;
      }
      
      // If visible and track ended, user likely stopped sharing via browser UI
      if (!document.hidden) {
        console.log('✋ User stopped screen sharing via browser');
        await stopScreenShare();
      }
    };

    videoTrack.on('track-ended', handleTrackEnded);
    if (audioTrack) {
      audioTrack.on('track-ended', handleTrackEnded);
    }
  };

  const createScreenTrackWithFallback = async () => {
    try {
      // First attempt: Try with audio
      console.log('🎵 Attempting screen share with audio...');
      const screenTracks = await AgoraRTC.createScreenVideoTrack({
        encoderConfig: "1080p_1",
        optimizationMode: "detail"
      }, "enable");

      hasAudioRef.current = Array.isArray(screenTracks);
      return screenTracks;
    } catch (error: any) {
      console.log('🔇 Audio screen share failed, trying without audio...', error.code);
      
      // Second attempt: Try without audio
      try {
        const screenTrack = await AgoraRTC.createScreenVideoTrack({
          encoderConfig: "1080p_1",
          optimizationMode: "detail"
        }, "disable");

        hasAudioRef.current = false;
        return screenTrack;
      } catch (videoError: any) {
        console.error('❌ Both audio and video-only screen share failed:', videoError);
        throw videoError;
      }
    }
  };

  const attemptScreenShareRecovery = async () => {
    if (isRecoveringRef.current || !screenShareIntentRef.current) return;
    
    console.log('🔄 Attempting to recover screen sharing after tab switch...');
    isRecoveringRef.current = true;
    setIsScreenShareLoading(true);
    
    try {
      // Check if current tracks are still valid
      const currentVideoTrack = screenTrackRef.current;
      const currentAudioTrack = screenAudioTrackRef.current;
      
      let tracksValid = false;
      if (currentVideoTrack) {
        try {
          // Try to access track properties to see if it's still alive
          tracksValid = currentVideoTrack.getMediaStreamTrack()?.readyState === 'live';
        } catch (error) {
          tracksValid = false;
        }
      }
      
      if (!tracksValid) {
        console.log('🔧 Tracks are invalid, creating new ones...');
        
        // Clean up dead tracks
        if (currentVideoTrack) {
          try { currentVideoTrack.close(); } catch (e) { /* ignore */ }
        }
        if (currentAudioTrack) {
          try { currentAudioTrack.close(); } catch (e) { /* ignore */ }
        }
        
        // Create new tracks with fallback logic
        const screenTracks = await createScreenTrackWithFallback();

        // Handle both single track and array of tracks (with audio)
        if (Array.isArray(screenTracks)) {
          const [screenVideoTrack, screenAudioTrack] = screenTracks;
          screenTrackRef.current = screenVideoTrack;
          screenAudioTrackRef.current = screenAudioTrack;
          setupTrackEventListeners(screenVideoTrack, screenAudioTrack);
          console.log('✅ Screen share recovered with audio');
        } else {
          screenTrackRef.current = screenTracks;
          screenAudioTrackRef.current = null;
          setupTrackEventListeners(screenTracks);
          console.log('✅ Screen share recovered (video only)');
        }
        
        setIsScreenSharing(true);
        setIsScreenSharePaused(false);
        toast.success('Screen sharing restored after tab switch');
      } else {
        console.log('✅ Screen tracks are still valid');
        setIsScreenSharePaused(false);
      }
      
    } catch (error: any) {
      console.error('❌ Failed to recover screen sharing:', error);
      
      if (error.code === 'PERMISSION_DENIED') {
        toast.error('Screen sharing permission lost - please restart');
        await stopScreenShare();
      } else {
        toast.error('Failed to restore screen sharing');
        // Reset state but keep intent for potential manual retry
        setIsScreenSharing(false);
        setIsScreenSharePaused(false);
      }
    } finally {
      setIsScreenShareLoading(false);
      isRecoveringRef.current = false;
    }
  };

  const startScreenShare = async () => {
    if (isScreenSharing || isScreenShareLoading) return;

    setIsScreenShareLoading(true);
    try {
      console.log('🖥️ Starting screen share...');

      // Create screen sharing track with fallback logic
      const screenTracks = await createScreenTrackWithFallback();

      // Handle both single track and array of tracks (with audio)
      if (Array.isArray(screenTracks)) {
        // Chrome 74+ with audio support
        const [screenVideoTrack, screenAudioTrack] = screenTracks;
        screenTrackRef.current = screenVideoTrack;
        screenAudioTrackRef.current = screenAudioTrack;
        setupTrackEventListeners(screenVideoTrack, screenAudioTrack);
        
        console.log('✅ Screen share with audio created');
        toast.success('Screen sharing started with audio');
      } else {
        // Single video track
        screenTrackRef.current = screenTracks;
        screenAudioTrackRef.current = null;
        setupTrackEventListeners(screenTracks);
        console.log('✅ Screen share created (video only)');
        toast.success('Screen sharing started');
      }

      setIsScreenSharing(true);
      setIsScreenSharePaused(false);
      screenShareIntentRef.current = true; // Mark user intent
      
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
      screenShareIntentRef.current = false;
      hasAudioRef.current = false;
      return null;
    } finally {
      setIsScreenShareLoading(false);
    }
  };

  const stopScreenShare = async () => {
    if (!screenTrackRef.current && !screenShareIntentRef.current) return;

    try {
      console.log('🛑 Stopping screen share...');
      
      // Clear user intent first
      screenShareIntentRef.current = false;
      hasAudioRef.current = false;
      
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
      setIsScreenSharePaused(false);
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
    isScreenSharePaused,
    startScreenShare,
    stopScreenShare,
    getScreenTracks,
    attemptScreenShareRecovery // Expose for manual recovery if needed
  };
};
