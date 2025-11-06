import { useState, useEffect, useRef, useCallback } from 'react';

const VOICE_LIMIT_SECONDS = 15 * 60; // 15 minutes
const WARNING_THRESHOLD = 0.8; // 80% = 12 minutes

interface VoiceTimerState {
  elapsedSeconds: number;
  remainingSeconds: number;
  percentUsed: number;
  isRunning: boolean;
  hasReachedLimit: boolean;
  shouldShowWarning: boolean;
}

export const useVoiceTimer = (conversationId: string | null) => {
  const [state, setState] = useState<VoiceTimerState>({
    elapsedSeconds: 0,
    remainingSeconds: VOICE_LIMIT_SECONDS,
    percentUsed: 0,
    isRunning: false,
    hasReachedLimit: false,
    shouldShowWarning: false,
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const accumulatedSecondsRef = useRef<number>(0);
  const hasShownWarningRef = useRef(false);

  // Load persisted time on mount
  useEffect(() => {
    if (!conversationId) return;

    const storageKey = `voice_timer_${conversationId}`;
    const stored = localStorage.getItem(storageKey);
    
    if (stored) {
      const elapsed = parseInt(stored, 10);
      accumulatedSecondsRef.current = elapsed;
      updateState(elapsed, false);
    }
  }, [conversationId]);

  const updateState = useCallback((elapsed: number, isRunning: boolean) => {
    const remaining = Math.max(0, VOICE_LIMIT_SECONDS - elapsed);
    const percent = (elapsed / VOICE_LIMIT_SECONDS) * 100;
    const hasReached = elapsed >= VOICE_LIMIT_SECONDS;
    const shouldWarn = percent >= WARNING_THRESHOLD * 100 && !hasReached;

    setState({
      elapsedSeconds: elapsed,
      remainingSeconds: remaining,
      percentUsed: Math.min(100, percent),
      isRunning,
      hasReachedLimit: hasReached,
      shouldShowWarning: shouldWarn,
    });

    // Show warning toast once at 80%
    if (shouldWarn && !hasShownWarningRef.current) {
      hasShownWarningRef.current = true;
    }
  }, []);

  const persist = useCallback((seconds: number) => {
    if (!conversationId) return;
    localStorage.setItem(`voice_timer_${conversationId}`, seconds.toString());
  }, [conversationId]);

  const start = useCallback(() => {
    if (state.hasReachedLimit || state.isRunning) return;

    startTimeRef.current = Date.now();
    
    intervalRef.current = setInterval(() => {
      if (!startTimeRef.current) return;

      const now = Date.now();
      const sessionElapsed = Math.floor((now - startTimeRef.current) / 1000);
      const totalElapsed = accumulatedSecondsRef.current + sessionElapsed;

      updateState(totalElapsed, true);

      // Auto-pause at limit
      if (totalElapsed >= VOICE_LIMIT_SECONDS) {
        pause();
      }
    }, 1000);

    updateState(accumulatedSecondsRef.current, true);
  }, [state.hasReachedLimit, state.isRunning, updateState]);

  const pause = useCallback(() => {
    if (!state.isRunning) return;

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (startTimeRef.current) {
      const sessionElapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      accumulatedSecondsRef.current += sessionElapsed;
      startTimeRef.current = null;
    }

    persist(accumulatedSecondsRef.current);
    updateState(accumulatedSecondsRef.current, false);
  }, [state.isRunning, persist, updateState]);

  const reset = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    startTimeRef.current = null;
    accumulatedSecondsRef.current = 0;
    hasShownWarningRef.current = false;

    if (conversationId) {
      localStorage.removeItem(`voice_timer_${conversationId}`);
    }

    updateState(0, false);
  }, [conversationId, updateState]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    ...state,
    start,
    pause,
    reset,
    formatTime: (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    },
  };
};
